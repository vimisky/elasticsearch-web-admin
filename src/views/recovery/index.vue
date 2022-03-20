<template>
  <el-container>
    <el-header>
      <el-row type="flex" justify="space-around" align="middle">
        <el-col :span="4">
          <span class="es-restful-endpoint-input-label" >ES Restful Endpoint</span>
        </el-col>
        <el-col :span="20">
          <el-input placeholder="请输入ES的restful URL" v-model="esBaseURL">
            <el-button
              slot="append"
              icon="el-icon-right"
              @click="handleFlushTreeData"
            ></el-button>
          </el-input>
        </el-col>
        <!-- <el-col :span="10"></el-col> -->
      </el-row>
    </el-header>

    <el-main>
      <div>
        <el-radio-group v-model="displayTab">
          <el-radio-button :label="0">未完成</el-radio-button>
          <el-radio-button :label="1">全部</el-radio-button>
        </el-radio-group>
      </div>

      <el-tree
        v-show="displayTab == 0"
        :data="alertTreeData"
        :props="defaultProps"
        default-expand-all
      >
        <span
          v-if="data.type"
          class="custom-tree-node"
          slot-scope="{ node, data }"
        >
          <span>{{ node.label }}</span>
          <el-tag>分片编号</el-tag
          ><el-tag type="warning">{{ data.shard.shard }}</el-tag>

          <el-tag>源</el-tag
          ><el-tag type="warning">{{ data.shard.source.node }}</el-tag>
          <el-tag>目标</el-tag
          ><el-tag type="warning">{{ data.shard.target.node }}</el-tag>
          <span> &nbsp;&nbsp; </span> <el-tag>状态</el-tag>
          <el-tag type="warning">
            {{ data.shard.stage }} </el-tag
          ><span>&nbsp;&nbsp;</span> <el-tag>文件</el-tag
          ><el-tag type="warning"
            >{{ data.shard.files.total }}({{ data.shard.files.recovered }},{{
              data.shard.files.percent
            }})</el-tag
          >
          <el-tag>数据量(字节)</el-tag
          ><el-tag type="warning"
            >{{ data.shard.bytes.total }}({{ data.shard.bytes.recovered }},{{
              data.shard.bytes.percent
            }})</el-tag
          >
          <el-tag>事务</el-tag
          ><el-tag type="warning"
            >{{ data.shard.translog_ops.total }}({{
              data.shard.translog_ops.recovered
            }},{{ data.shard.translog_ops.percent }})</el-tag
          >
        </span>
        <span v-else class="custom-tree-node" slot-scope="{ node }">
          <span class="mid-font">索引：{{ node.label }}</span>
        </span>
      </el-tree>
      <el-tree
        v-show="displayTab == 1"
        :data="treeData"
        :props="defaultProps"
        default-expand-all
      >
        <span
          v-if="data.type"
          class="custom-tree-node"
          slot-scope="{ node, data }"
        >
          <span>{{ node.label }}</span>
          <el-tag>分片编号</el-tag
          ><el-tag :type='convertStage2Css(data.shard)'>{{ data.shard.shard }}</el-tag>

          <el-tag>源</el-tag
          ><el-tag :type='convertStage2Css(data.shard)'>{{ data.shard.source.node }}</el-tag>
          <el-tag>目标</el-tag
          ><el-tag :type='convertStage2Css(data.shard)'>{{ data.shard.target.node }}</el-tag>
          <span> &nbsp;&nbsp; </span> <el-tag>状态</el-tag>
          <el-tag :type='convertStage2Css(data.shard)'>
            {{ data.shard.stage }} </el-tag
          ><span>&nbsp;&nbsp;</span> <el-tag>文件</el-tag
          ><el-tag :type='convertStage2Css(data.shard)'
            >{{ data.shard.files.total }}({{ data.shard.files.recovered }},{{
              data.shard.files.percent
            }})</el-tag
          >
          <el-tag>数据量(字节)</el-tag
          ><el-tag :type='convertStage2Css(data.shard)'
            >{{ data.shard.bytes.total }}({{ data.shard.bytes.recovered }},{{
              data.shard.bytes.percent
            }})</el-tag
          >
          <el-tag>事务</el-tag
          ><el-tag :type="convertStage2Css(data.shard)"
            >{{ data.shard.translog_ops.total }}({{
              data.shard.translog_ops.recovered
            }},{{ data.shard.translog_ops.percent }})</el-tag
          >
        </span>
        <span v-else class="custom-tree-node" slot-scope="{ node }">
          <span class="mid-font">索引：{{ node.label }}</span>
        </span>
      </el-tree>
    </el-main>
  </el-container>
</template>

<script>
import esRestApi from "@/api/es-rest-api";

export default {
  name: "RecoveryInfo",
  data: function () {
    return {
      esBaseURL: 'http://127.0.0.1:9200',
      displayTab: 0,
      esNodeList: null,
      esRecoveryMap: null,
      esRecoveringMap: null,
      esRecoveryTreeData: null,
      esRecoverinngTreeData: null,
      treeData: [],
      alertTreeData: [],
      defaultProps: {
        children: "children",
        label: "label",
      },
    };
  },
  methods: {
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
            nodeView.ip = nodeInfo[0];
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
    esGetRecoveryInfo: function () {
      esRestApi
        .catRecovery()
        .then((res) => {
          let recoveryArray = res.split("\n");
          let recoveryMap = new Map();
          let recoveringMap = new Map();
          recoveryArray.forEach((recoveryShardLine) => {
            let recoveryShardInfo = recoveryShardLine.split(/\s+/);
            let indexName = recoveryShardInfo[0];
            if (recoveryShardInfo[0]) {
              let recoveryShard = this.recoveryShardFrom(recoveryShardInfo);
              //加入recoveryMap
              let recoveryShards = recoveryMap.get(indexName);
              if (recoveryShards) {
                recoveryShards.push(recoveryShard);
              } else {
                recoveryShards = [];
                recoveryShards.push(recoveryShard);
                recoveryMap.set(indexName, recoveryShards);
              }
              //加入recoveringMap
              if (
                recoveryShardInfo[12] != recoveryShardInfo[14] ||
                recoveryShardInfo[16] != recoveryShardInfo[18] ||
                recoveryShardInfo[19] != recoveryShardInfo[20]
              ) {
                let recoveryShards = recoveringMap.get(indexName);
                if (recoveryShards) {
                  recoveryShards.push(recoveryShard);
                } else {
                  recoveryShards = [];
                  recoveryShards.push(recoveryShard);
                  recoveringMap.set(indexName, recoveryShards);
                }
              }
            }
          });

          this.esRecoveryMap = this.recoveryMapSortByKey(recoveryMap);
          this.esRecoveringMap = this.recoveryMapSortByKey(recoveringMap);
          this.esRecoveryTreeData = this.recoveryMap2TreeData(
            this.esRecoveryMap
          );
          this.esRecoverinngTreeData = this.recoveryMap2TreeData(
            this.esRecoveringMap
          );
        })
        .catch();
    },
    handleGetTreeData: function () {
      this.treeData = this.esRecoveryTreeData;
      this.alertTreeData = this.esRecoverinngTreeData;
    },

    handleFlushTreeData: function () {
      esRestApi.baseurl = this.esBaseURL;
      this.esGetRecoveryInfo();
    },
    recoveryShardFrom: function (recoveryShardInfo) {
      return {
        index: recoveryShardInfo[0],
        shard: recoveryShardInfo[1],
        time: recoveryShardInfo[2],
        type: recoveryShardInfo[3],
        stage: recoveryShardInfo[4],
        source: {
          host: recoveryShardInfo[5],
          node: recoveryShardInfo[6],
        },
        target: {
          host: recoveryShardInfo[7],
          node: recoveryShardInfo[8],
        },
        files: {
          files: recoveryShardInfo[11],
          recovered: recoveryShardInfo[12],
          percent: recoveryShardInfo[13],
          total: recoveryShardInfo[14],
        },
        bytes: {
          bytes: recoveryShardInfo[15],
          recovered: recoveryShardInfo[16],
          percent: recoveryShardInfo[17],
          total: recoveryShardInfo[18],
        },
        translog_ops: {
          translog_ops: recoveryShardInfo[19],
          recovered: recoveryShardInfo[20],
          percent: recoveryShardInfo[21],
          total: recoveryShardInfo[19],
        },
      };
    },
    recoveryMapSortByKey: function (unsortedRecoveryMap) {
      let unsortedRecoveryArray = Array.from(unsortedRecoveryMap);
      let sortedRecoveryArray = unsortedRecoveryArray.sort(function (a, b) {
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
      return new Map(sortedRecoveryArray);
    },
    recoveryShard2String: function (_recoveryShard) {
      return (
        _recoveryShard.shard +
        ":" +
        _recoveryShard.source.node +
        " -> " +
        _recoveryShard.target.node +
        ":" +
        _recoveryShard.files.total +
        "(" +
        _recoveryShard.files.recovered +
        "," +
        _recoveryShard.files.percent +
        ")" +
        _recoveryShard.bytes.total +
        "(" +
        _recoveryShard.bytes.recovered +
        "," +
        _recoveryShard.bytes.percent +
        ")" +
        _recoveryShard.translog_ops.total +
        "(" +
        _recoveryShard.translog_ops.recovered +
        "," +
        _recoveryShard.translog_ops.percent +
        ")"
      );
    },
    recoveryMap2TreeData: function (_recoveryMap) {
      let treeData = [];
      _recoveryMap.forEach((recoveryShards, indexName) => {
        let treenode = {
          label: indexName,
          type: 0,
          children: [],
        };

        recoveryShards.forEach((recoveryShard) => {
          let treesubnode = {
            //"恢复情况",
            label: "", //this.recoveryShard2String(recoveryShard),
            type: 1,
            shard: recoveryShard,
          };
          treenode.children.push(treesubnode);
        });

        treeData.push(treenode);
      });
      return treeData;
    },
    convertStage2Css: function(_shard){
        if (_shard.stage == "done" && 
        (_shard.files.total == _shard.files.recovered) && 
        (_shard.bytes.total == _shard.bytes.recovered) && 
        (_shard.translog_ops.total == _shard.translog_ops.recovered)) {
            return "success";
        }else{
            return "warning";
        }
    }
  },
  watch: {
    esRecoveryTreeData: function () {
      this.handleGetTreeData();
    },
  }
  // ,
  // created: function () {
  //   this.handleFlushTreeData();
  // },
};
</script>

<style scoped>
.mid-font {font-size: 14px;}
@media screen and (max-width:500px) {
.es-restful-endpoint-input-label {display: none}  
}

</style>
<!--
<style >

div.el-tree-node {
  white-space: normal;

}
div.el-tree-node   .el-tree-node__content {
    height: 100%;
    align-items: start;
  }
</style>
-->
<style lang="scss">

div.el-tree-node {
  white-space: normal;
  .el-tree-node__content {
    height: 100%;
    align-items: start;
  }
}
 
</style>