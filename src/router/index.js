import Vue from 'vue'
import VueRouter from 'vue-router'
Vue.use(VueRouter)

const ShardInfo = () => import('@/views/shard')
const RecoveryInfo = () => import('@/views/recovery')
const SegmentInfo = () => import('@/views/segment')
const Info = () => import('@/views/info')


const router = new VueRouter({
    routes:[
        // {
        //     path: '/',
        //     name: '首页',
        //     component: Index
        // },
        {
            path: '/shardinfo',
            name: '分片信息',
            component: ShardInfo
        },
        {
            path: '/recoveryinfo',
            name: '恢复信息',
            component: RecoveryInfo
        },
        {
            path: '/segmentinfo',
            name: '段信息',
            component: SegmentInfo
        },         
        {
            path: '/info',
            name: '信息',
            component: Info
        }
    ]
});

export default router