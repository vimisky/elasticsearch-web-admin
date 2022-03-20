import axios from 'axios'

const request = axios.create();
// request.defaults.baseURL = "http://127.0.0.1:19200"
request.defaults.timeout = 300000
request.defaults.headers.common['Content-Type'] = 'application/json';

const ESRestApi = {
    baseurl: "http://127.0.0.1:19203",
    catHealth: function(){
        return new Promise((resolove, reject)=>{
            request.get(this.baseurl + "/_cat/health").then(
                res => {resolove(res.data)}
            ).catch(
                error => {
                    reject(error)
                }
            );
        });
    },
    catCount: function(){
        return new Promise((resolove, reject)=>{
            request.get(this.baseurl + "/_cat/count").then(
                res => {resolove(res.data)}
            ).catch(
                error => {
                    reject(error)
                }
            );
        });
    },  
    catAllocation: function(){
        return new Promise((resolove, reject)=>{
            request.get(this.baseurl + "/_cat/allocation").then(
                res => {resolove(res.data)}
            ).catch(
                error => {
                    reject(error)
                }
            );
        });
    },             
    catShards: function(){
        return new Promise((resolove, reject)=>{
            request.get(this.baseurl + "/_cat/shards").then(
                res => {resolove(res.data)}
            ).catch(
                error => {
                    reject(error)
                }
            );
        });
    },
    catNodes: function(){
        return new Promise((resolove, reject)=>{
            request.get(this.baseurl + "/_cat/nodes").then(
                res => {resolove(res.data)}
            ).catch(
                error => {
                    reject(error)
                }
            );
        });
    },
    catIndices: function(){
        return new Promise((resolove, reject)=>{
            request.get(this.baseurl + "/_cat/indices").then(
                res => {resolove(res.data)}
            ).catch(
                error => {
                    reject(error)
                }
            );
        });
    },
    catRecovery: function(){
        return new Promise((resolove, reject)=>{
            request.get(this.baseurl + "/_cat/recovery").then(
                res => {resolove(res.data)}
            ).catch(
                error => {
                    reject(error)
                }
            );
        });
    },
    _segments: function(){
        return new Promise((resolove, reject)=>{
            request.get(this.baseurl + "/_segments").then(
                res => {resolove(res.data)}
            ).catch(
                error => {
                    reject(error)
                }
            );
        });        
    }            
}

export default ESRestApi