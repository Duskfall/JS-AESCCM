importScripts('https://crypto-js.googlecode.com/svn/tags/3.1.2/build/rollups/aes.js',
			   'https://crypto-js.googlecode.com/svn/tags/3.1.2/build/components/mode-ecb-min.js',
			   'https://crypto-js.googlecode.com/svn/tags/3.1.2/build/components/pad-nopadding-min.js',
			   'https://rawgithub.com/bitwiseshiftleft/sjcl/master/sjcl.js',
			   'FileUtils.js',
			   'CCM.js',
			   'aesasm.js',
			   'asmCrypto.js');
    


var key = FileUtils.toByteArray('a2d0136b2f2bd7efb4d9bc91c0cd7c02');
var iv = FileUtils.toByteArray('6332383534303366');
var adata = FileUtils.toByteArray('61757468656e7469636174696f6e2064617461');
    
var heap = new Uint8Array(0x200000), // first valid heap size after 0x101000
    asm = aesasm(heap),
    nonce = key;
    //iv  = new Uint8Array(16),
    //ctr = 0;

console.log(asm);

onmessage = function(e)
{
	
	//var ul_reader = new FileReaderSync();
	//var arrayBuffer = ul_reader.readAsArrayBuffer(e.data);
	var totalbytes = 0;
	var arrayargs = [];
	for(var i=0;i<e.data.length;i++){
		totalbytes += e.data[i].size;
	}
	//console.log(e.data.size);
	var ccm = new CCM(key, iv, adata, 16, e.data.size);
	//for(var i=0;i<e.data.length;i++){
		FileUtils.readNextBytes(e.data, 0, FileUtils.buffer_size, function(result) {
			var encrypted = ccm.encryptBlock(result);
			//console.log(FileUtils.toHex(encrypted))
			postMessage(encrypted);
			if (ccm.exit_next == 1) {
				//Telos -> pairnw to tag
				var tag = ccm.getTag();
				//edw anevazeis to tag ston server
				postMessage(tag);
				console.log("Tag: " + FileUtils.toHex(tag));
			}
		});
	//}
	
	
	
	//var sliceSize = arrayBuffer.byteLength;
	//var encryptedBase64Slices = [];
	//for (var offset = 0; offset < arrayBuffer.byteLength; offset += sliceSize) {
	//  var slice = arrayBuffer.slice(offset, offset + sliceSize);
	//  var byteSlice = new Uint8Array(slice);
	//  var bitsSlice = sjcl.codec.bytes.toBits(byteSlice);
	//  var encryptedSlice = sjcl.mode.ccm.encrypt(aes, bitsSlice, iv, ad, 128);
	//  var binary = sjcl.codec.bytes.fromBits(encryptedSlice);
	//  //console.log(binary);
	//  //postMessage(binary);
	//  //var encryptedBase64Slice = sjcl.codec.base64.fromBits(encryptedSlice);
	//  //encryptedBase64Slices.push(encryptedBase64Slice);
	//}
			  //console.log(result);
	//postMessage(result);
	//function proceedWithEncryption(rawdataarray){
	//	console.log("proceedWithEncryption called")
	//	//console.log(asmCrypto);
	//	//bytes_to_hex();
	//	//asmCrypto.ccm_aes_encrypt_process(dataToEncrypt);
	//	
	//	var encrypted = asmCrypto.AES_CCM.encrypt( rawdataarray, key, nonce, adata, 16) ;
	//	postMessage(encrypted);
	//}
	//var data = new Uint8Array( e.data.buffer || e.data );
	


	//if (typeof MSBlobBuilder == "function") postMessage(data);
	//else postMessage(data.buffer,[data.buffer]);
};

