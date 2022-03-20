<template>
    <div>
        {{segmentCount}}
    </div>
</template>
<script>
import esRestApi from "@/api/es-rest-api";
export default {
    name: "SegmentInfo",
    data: function(){
        return {
            segmentCount: 0
        }
    },
    methods: {
        esGetSegments: function(){
            return esRestApi._segments().then((res) => {
                console.log(res);
                
            }).catch();
        },
        handleFlushSegments: function(){
            this.esGetSegments();
        }
    },
    created: function(){
        this.handleFlushSegments();
    }
}
</script>