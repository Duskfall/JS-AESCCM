function sliceBlob(blob, start, end, type) {

    type = type || blob.type;

    if (blob.mozSlice) {
        return blob.mozSlice(start, end, type);
    } else if (blob.webkitSlice) {
        return blob.webkitSlice(start, end, type);
    } else {
        throw new Error("This doesn't work!");
    }
}
//function proceedWithEncryption (){
//    var worker = new Worker('js/encrypter.js');
//    worker.postMessage = worker.webkitPostMessage || worker.postMessage;
//    worker.onmessage = function(e)
//    {
//        console.log(e.data);
//        ul_chunk = new Uint8Array(e.data.buffer || e.data);
//    };
//    worker.postMessage(rawdata);
//}
//ul_reader.readAsArrayBuffer(data.data);
//ul_reader.onloadend = function(evt)
//{
//    if (evt.target.readyState == FileReader.DONE)
//    {
//        rawdata = new Uint8Array(evt.target.result);
//        proceedWithEncryption();
//    }
//}


var arrayofblobs = [];
var spliceoffset = 0;
$(document).ready(function(){
    $("#fileselect").change(function(e){
        var filelist = e.target.files;
        for (var i = 0; i < filelist.length; i++) {
           var file = filelist[i];
           var fileSize = file.size;
           var fileName = file.name;
           // calculate the start and end byte index for each blocks(chunks)
           // with the index, file name and index list for future using
           var blockSizeInKB = 1024 * 16;
           var blockSize = blockSizeInKB * 1;
           var blocks = [];
           var offset = 0;
           var index = 0;
           var list = "";
           while (offset < fileSize) {
               var start = offset;
               var end = Math.min(offset + blockSize, fileSize);
               blocks.push({
                   name: fileName,
                   index: index,
                   start: start,
                   end: end
               });
               list += index + ",";
    
               offset = end;
               index++;
           }
            var putBlocks = [];
            var ul_chunk;
            var blockcount = 0;
            var counter = 0;
            blocks.forEach(function (block) {
                putBlocks.push(file.slice(block.start, block.end));
                blockcount++;
            });
            var worker = new Worker('js/encrypter.js');
            worker.postMessage = worker.webkitPostMessage || worker.postMessage;
            if (typeof(e.data) == 'string'){
                    console.log("Worker: " + e.data);
                    return;
            }else{
                //console.log(putBlocks)
                //worker.postMessage(putBlocks);
                worker.postMessage(file);
            }
            var start = new Date().getTime();
            worker.onmessage = function(e)
            {
                ul_chunk = new Uint8Array(e.data.buffer || e.data);
                //var decrypted = asmCrypto.bytes_to_hex(asmCrypto.AES_CCM.decrypt( ul_chunk, key, nonce, adata, 16)) ;
                //console.log(ul_chunk)
                var currentbytes = e.data.buffer*counter;
                //console.log(e.data.buffer.byteLength)
                //console.log(e.data.buffer.byteLength*counter);
                //console.log(blockSize*(counter) + e.data.buffer.byteLength);
                //console.log(blockcount)
                $.ajax({
                    url: '/uploads',
                    type: 'POST',
                    dataType: 'json',
                    headers: {
                        "Content-Range": "bytes " + (e.data.buffer.byteLength*counter % blockSize  == 0 ? e.data.buffer.byteLength*counter : blockSize*counter) + "-" + (blockSize*(counter+1) < fileSize ? e.data.buffer.byteLength*(counter+1) - 1: blockSize*(counter) + e.data.buffer.byteLength -1) +"/" + (fileSize + 16 + blockcount-1),
                        "Content-Disposition" : 'attachment; filename="CAM00010.jpg"',
                        "Session-ID" : "0305505550"
                    },
                    contentType: 'application/octet-stream',
                    data: new Uint8Array(e.data.buffer || e.data),
                    processData: false
                });
                counter++;
                var end = new Date().getTime();
                console.log(end-start);
            };
            //async.series(putBlocks, function (error, result) {
            //    var data = {
            //        name: fileName,
            //        list: list
            //    };
            //    $.post("/Home/Commit", data, function (result) {
            //        if (!result.success) {
            //            alert(result.error);
            //        }
            //        else {
            //            alert("done!");
            //        }
            //    });
            //});
        }
            //var decrypted = asmCrypto.bytes_to_hex(asmCrypto.AES_CCM.decrypt( asmCrypto.hex_to_bytes("37c3effe00eb1eb4811ca391bd98b1e3102f0512a3f0fd8d4458f473fe226efb3e11a40add0951bb8a942168d7d1a85d5fb9e0d83065a713bbc9796af3ebb4f9b3a8bbb7015124362fae898511d9b1dcae038cc5f1715a60c0de168f405b6a96fa8dc2014f3a4d557624526073d0ebfd3fd9c9a55eccf953b0b500b2ab5d1e1be25b3f6aad90da5fef415db91302e7e48eee50d10a89cf61f5e6a8d3aed6e2053266dc96bc9b2e48c15d0ec5afa7bdd2fd5469dc0c62a29575cc4757604ea19b7e704c3a815f965afb1920f2adb830dce9373a3cb9bbef8d27a288274ccae745ca4af3491fc56e9121c568bcb8bc4754663cd809d8734ae0ba25ec0bae409904e2b84b8c6b1fdae9a587636a483853805882fb8aaa2694f8f965cd33e582d8fb2cbb181ff4bed27c7184c658fd34afc5b1737edfc07fda48f9bf440ca80ae06dde6be8c3ee19fa64e68209f17c7e4613a1ec722624c329e089b3353cf633e5adf0642b4b41930ef2fd12df5cdcacf0719e7d43cbd09398fa3f840e92ca5b5090112358787fc150052c0c45bc3f51fcdfe788146b263cb1e75f75659fbbb52c82e9a2f264d5506b06a5e789bce58c20816a06186b13ec65eafaf9340e1441a2a280797fdd54affcd5159f09bd3d287ee46f13a7f0258c22694b4d03197d1dfd406a6de08a79865b508825b8e4131f831afe96d2dfc565f0d9ba007dd179d321b708c5e03fb830be604de027b237ed6202915525b8dce369cfdd3de1089e3c2c4eff95763d253f0f9db228a07639a9f809afec57ffa526d5479cc506e6f823bbe07c828050e06d38d34ea3ef3ac76b496d79ea12e8031a9ce5efeaea0e00d0f5d4c3cea5cd408c46c8912aa7a350ae4bd0d8f4b361a1fd474e6fa0318eb8d55b3240113958a74acbd635083c90f7e320b508a5317bc56b269776acf1efa6395032d575ab121d9a1cf2e18f2306ad2929d9e3a3951cfb44052f215ca2330026ec661176de32aa57afc91310227477fe51b9747be50ad5f0a7727609753259fc0a4f5b5f548f861950eaab20f4adf683d4691814b6dc57762b85f6cd24fd70c3732e4f86a57ebe192d96721286863d5bcf89aefe8a2b3ff57a6be7317ffbaec494e6ec1aa0d359cbfb5ba797629915c136624db880337455b89118eb20677624fd7f2466743b04292421c35859f001d22ab7c947969a35e42def69d770aa87afb99cb6bcb07740601b34c90a8f0271c0fde893b2ec77c07afbeb66a8743d14ee1f51eaf9cfb073ae338710df7914a37661a58b412bd997b94439a98270a01f1690c2e6921df7183ecd20b6495f8ee616b336aee290beb624bd1f26c16eb8c457f7a7497bfdc989b756e7f9b2eb6872ee36deba87bcf10e9c63f117e18cbebb6b1740cceadd1fcafea6d3ec7724e1bddb87839ef439bf67a0c4251ac22e48d7249364955649b4d376bc32"), key, nonce, adata, 16)) ;
            //console.log(decrypted)
    });  
})























