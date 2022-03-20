<template>
  <el-container>
    <el-header>
      <el-row type="flex" justify="space-around" align="middle">
        <el-col :span="4">
          <span >ES Restful Endpoint</span>
        </el-col>
        <el-col :span="20">
          <el-input placeholder="请输入ES的restful URL" v-model="esBaseURL">
            <el-button
              slot="append"
              icon="el-icon-right"
              @click="handleFlushTableData"
            ></el-button>
          </el-input>
        </el-col>
        <!-- <el-col :span="10"></el-col> -->
      </el-row>
    </el-header>
    <el-main>
      <el-descriptions title="集群信息">
        <el-descriptions-item label="集群名称">{{
          esInfo.cluster
        }}</el-descriptions-item>
        <el-descriptions-item label="集群状态">{{
          esInfo.status
        }}</el-descriptions-item>
        <el-descriptions-item label="节点数量">{{
          esInfo.nodeCount
        }}</el-descriptions-item>
        <el-descriptions-item label="索引总数量">{{
          esInfo.indexCount
        }}</el-descriptions-item>
        <el-descriptions-item label="文档总数量">{{
          esInfo.count
        }}</el-descriptions-item>
        <el-descriptions-item label="存储总数量">{{
          esInfo.storageSize
        }}</el-descriptions-item>
        <el-descriptions-item label="分片总数量">{{
          esInfo.shards
        }}</el-descriptions-item>
        <el-descriptions-item label="未分配分片数量">{{
          esInfo.unassign
        }}</el-descriptions-item>
      </el-descriptions>
      <el-table :data="tableData" style="width: 100%" :height="tableHeight">
        <el-table-column prop="index" label="索引" width="300px">
        </el-table-column>
        <el-table-column prop="health" label="健康" width="50px">
        </el-table-column>
        <el-table-column prop="status" label="状态" width="50px">
        </el-table-column>
        <el-table-column prop="docs.count" label="文档数" width="100px">
        </el-table-column>
        <el-table-column prop="docs.deleted" label="已删除" width="100px">
        </el-table-column>
        <el-table-column prop="store.size" label="存储" width="100px">
        </el-table-column>
        <el-table-column
          v-for="esNode in esNodeList"
          v-bind:key="esNode.name"
          v-bind:prop="esNode.name"
          v-bind:label="esNode.name + esNode.master"
          width="200px"
        >
          <template slot-scope="scope">
            <div v-html="scope.row[esNode.name]"></div>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentpage"
        :page-sizes="[10, 15, 30, 50, 100, 200, esInfo.indexCount]"
        :page-size="pagesize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="esInfo.indexCount"
      >
      </el-pagination>
    </el-main>
  </el-container>
</template>

<script>
import esRestApi from "@/api/es-rest-api";
//   import Lodash from 'lodash'

export default {
  name: "ShardInfo",
  data: function () {
    return {
      esBaseURL: "http://127.0.0.1:9200",
      flushFlag: false,
      currentpage: 1,
      pagesize: 0,
      esInfo: {
        cluster: "",
        status: "",
        nodeCount: 0,
        shards: 0,
        unassign: 0,
        count: 0,
        indexCount: 0,
        storageSize: "",
      },
      esIndexMap: null,
      esNodeList: null,
      esShardList: null,
      tableData: [],
      tableHeight: "500px",
    };
  },
  methods: {
    esGetInfo: function () {
      let get01 = esRestApi
        .catHealth()
        .then((res) => {
          var healthArray = res.split(/\s+/);

          this.esInfo.cluster = healthArray[2];
          this.esInfo.status = healthArray[3];
          this.esInfo.nodeCount = healthArray[4];
          this.esInfo.shards = healthArray[6];
          this.esInfo.unassign = healthArray[10];
        })
        .catch();

      let get02 = esRestApi
        .catCount()
        .then((res) => {
          var countArray = res.split(/\s+/);
          this.esInfo.count = countArray[2];
        })
        .catch();
      let get03 = esRestApi
        .catAllocation()
        .then((res) => {
          var allocationArray = res.split("\n");
          this.esInfo.storageSize = "";
          allocationArray.forEach((allocationLine) => {
            var allocationInfo = allocationLine.split(/\s+/);
            this.esInfo.storageSize +=
              (allocationInfo[1] ? allocationInfo[1] : "") + " ";
          });
        })
        .catch();
      return Promise.all([get01, get02, get03]);
    },
    esGetIndices: function () {
      console.log("esGetIndices被调用");
      return esRestApi
        .catIndices()
        .then((res) => {
          var indexArray = res.split("\n");
          var indices = new Map();

          this.esInfo.indexCount = indexArray.length;

          indexArray.forEach((indexLine) => {
            var indexInfo = indexLine.split(/\s+/);
            var indexView = {
              index: indexInfo[2],
              health: indexInfo[0],
              status: indexInfo[1],
              docs: {
                count: indexInfo[6],
                deleted: indexInfo[7],
              },
              store: {
                size: indexInfo[8],
              },
            };

            indices.set(indexView.index, indexView);
          });
          this.esIndexMap = indices;
          console.log("esIndexMap赋值");
          console.log(this.esIndexMap);
        })
        .catch();
    },
    esGetNodes: function () {
      return esRestApi
        .catNodes()
        .then((res) => {
          var nodeArray = res.split("\n");
          var nodes = [];
          nodeArray.forEach((nodeLine) => {
            var nodeInfo = nodeLine.split(/\s+/);
            var nodeView = {};
            nodeView.name = nodeInfo[9];
            if (nodeInfo[8] == "*") {
              nodeView.master = "(主)";
            } else if (nodeInfo[8] == "-") {
              nodeView.master = "(从)";
            } else {
              nodeView.master = "(异常)";
            }

            nodeView.name && nodes.push(nodeView);
          });
          this.esNodeList = nodes;
        })
        .catch();
    },
    esGetShards: function () {
      esRestApi
        .catShards()
        .then((res) => {
          var shardArray = res.split("\n");
          var shards = new Map();
          shardArray.forEach((shardLine) => {
            var shardInfo = shardLine.split(/\s+/);
            var shardView = {};
            shardView.index = shardInfo[0];
            shardView.shard = shardInfo[1];
            shardView.prirep = shardInfo[2];
            shardView.state = shardInfo[3];
            shardView.docs = shardInfo[4];
            shardView.store = shardInfo[5];
            shardView.ip = shardInfo[6];
            shardView.node = shardInfo[7];

            if (shards.get(shardView.index) == undefined) {
              var shardViewArray = [];
              shardViewArray.push(shardView);
              shards.set(shardView.index, shardViewArray);
            } else {
              shards.get(shardView.index).push(shardView);
            }
          });
          //排序
          var unsortedShardArray = Array.from(shards);
          var sortedShardArray = unsortedShardArray.sort(function (a, b) {
            if (a[0] > b[0]) {
              return 1;
            }
            if (a[0] == b[0]) {
              return 0;
            }
            if (a[0] < b) {
              return -1;
            }
          });
          var sortedShardMap = new Map(sortedShardArray);

          var indexViewArray = [];
          sortedShardMap.forEach((_shardViewArray, indexName) => {
            var indexView = {};
            indexView.index = indexName;
            var indexInfo = this.esIndexMap.get(indexName);
            if (indexInfo != undefined) {
              indexView.health = indexInfo.health;
              indexView.status = indexInfo.status;
              indexView.docs = {
                count: indexInfo.docs.count,
                deleted: indexInfo.docs.deleted,
              };
              indexView.store = indexInfo.store;
            }

            this.esNodeList.forEach((esnode) => {
              _shardViewArray.forEach((_shardView) => {
                if (_shardView.node == esnode.name) {
                  if (_shardView.prirep == "p") {
                    if (indexView[esnode.name]) {
                      indexView[esnode.name] +=
                      '<span class="vimi-shard vimi-shard-primary">' +
                      _shardView.shard +
                      "</span>";
                    } else {
                      indexView[esnode.name] =
                      '<span class="vimi-shard vimi-shard-primary">' +
                      _shardView.shard +
                      "</span>";
                    }
                    
                  }
                  if (_shardView.prirep == "r") {
                    if (indexView[esnode.name]) {
                      indexView[esnode.name] +=
                        '<span class="vimi-shard vimi-shard-replica">' +
                        _shardView.shard +
                        "</span>";                      
                    } else {
                      indexView[esnode.name] =
                        '<span class="vimi-shard vimi-shard-replica">' +
                        _shardView.shard +
                        "</span>";                      
                    }

                  }
                }
              });
            });
            indexViewArray.push(indexView);
          });

          this.esShardList = indexViewArray;
        })
        .catch((error) => {
          console.log("catch " + error);
        });
    },
    handleSizeChange: function (size) {
      this.pagesize = size;
      this.tableHeight = size * 50 + "" + +"px";
      this.handleGetTableData();
    },
    handleCurrentChange: function (page) {
      this.currentpage = page;
      this.handleGetTableData();
    },
    handleGetTableData: function () {
      var start = this.pagesize * (this.currentpage - 1);
      var end = this.pagesize * this.currentpage;
      this.indexcount = this.esShardList.length;
      if (end > this.indexcount) {
        end = this.indexcount;
      }
      console.log("start, end, indexcount");
      console.log(start, end, this.indexcount);

      var displayData = [];

      for (let index = start; index < end; index++) {
        displayData.push(this.esShardList[index]);
      }
      this.tableData = displayData;
    },
    handleFlushTableData: function () {
      esRestApi.baseurl = this.esBaseURL;
      Promise.all([this.esGetNodes(), this.esGetInfo(), this.esGetIndices()])
        .then((res) => {
          this.flushFlag = true;
          res;
        })
        .catch();
    },
  },
  watch: {
    flushFlag: function () {
      this.flushFlag && this.esGetShards();
    },
    esShardList: function () {
      this.handleSizeChange(10);
    },
  },
  // ,
  // created: function () {
  //   this.handleFlushTableData();
  // },
};
</script>

<style>
span.vimi-shard {
  border: white;
  padding: 2px;
  color: white;
}
span.vimi-shard-primary {
  background-color: green;
}
.vimi-shard-replica {
  background-color: blueviolet;
}
</style>