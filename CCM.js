function CCM(key, iv, adata, tag_length, filesize) {
    this.key = key;
    this.iv = iv;
    this.adata = adata;
    this.tag_length = tag_length;
    this.filesize = filesize;
    this.bytes_left = filesize;
    this.exit_next = -1;
    
    this.CC = new Uint8Array(CCM.block_size * CCM.blocks_count);
    this.Y = new Uint8Array(CCM.block_size);
    this.S0 = new Uint8Array(CCM.block_size);
    
    this.char_ctr = this.generate_counter_block();
    this.char_ctr_cipher = this.AESEncryptBlock(this.char_ctr);
    
    //console.log(FileUtils.toHex(FileUtils.base64ToByteArray(this.char_ctr_cipher.toString())));
    
    for (var i = 0; i < this.Y.length; i++) {
        this.Y[i] = 0x0;
    }
}

CCM.block_size = 16;
CCM.blocks_count = 1024;

CCM.prototype.generate_counter_block = function(buffer) {
    buffer = new Uint8Array(CCM.block_size); 
    
    var q_len = 15 - this.iv.length;
    var fl = 0x00;
    
    fl |= (q_len - 1) & 0x07;
    
    buffer[0] = fl;
    
    for (var i = 0; i < this.iv.length; i++) {
        buffer[i+1] = this.iv[i];
    }
    
    for (var i = this.iv.length+1; i < CCM.block_size; i++) {
        buffer[i] = 0x00;
    }
    
    return buffer;
}

CCM.prototype.getTag = function(){
    var tagBuffer = new Uint8Array(CCM.block_size);
    //this.bytesXorWithBytes:this.Y;
}
CCM.prototype.formatting_NAP = function(plainDataBlock){
   
    if (this.exit_next == -1) {
        var header = this.formatHeaderWithPayloadLength(this.filesize);
        var assocData = this.formatAssociatedData();
        var payload = this.formatPayload(plainDataBlock);
        var finaldata = new Uint8Array(header.length +  assocData.length + payload.length);
        finaldata.set(header);
        finaldata.set(assocData,header.length);
        finaldata.set(payload,header.length+assocData.length);
        return finaldata;
    }else{
        var payload = this.formatPayload(plainDataBlock);
        return payload;
    }

}

CCM.prototype.formatHeaderWithPayloadLength = function (payloadLength){
    var buffer = new Uint8Array(CCM.block_size);
    var qLen = 15 - this.iv.length;
    var fl = 0x00;
    
    fl |= (this.adata.length > 0) ? 0x40 : 0x00;
    fl |= ((((this.tag_length - 2) / 2) & 0x07) << 3);
    fl |= ((qLen - 1) & 0x07);
    
    buffer[0] = fl;
    for (var i = 0; i < qLen; i++) {
        buffer[ CCM.block_size - i - 1] = payloadLength & 255;
        payloadLength >>= 8;
    }
    
    for (var i = 0; i < this.iv.length; i++) {
        buffer[ i + 1] = this.iv[i];
    }
    return buffer;
}

CCM.prototype.formatPayload = function (plainDataBlock){
    var pad = plainDataBlock.length % CCM.block_size;
    var buffer = new Uint8Array(plainDataBlock.length );
    for (var i = 0; i < plainDataBlock.length; i++) {
        buffer[i]  = plainDataBlock[i];
    }
    if (pad > 0) {
        for (var i = 0; i < CCM.block_size - pad; i++) {
            buffer[ plainDataBlock.length + i ] = 0x00;
        }
    }
    return buffer;
}
CCM.prototype.bytesXorWithBytes = function(bytesLeft,bytesRight){
    var buffer = new Uint8Array(bytesLeft.length);
    for (var i = 0; i < bytesRight.length; i++) {
        buffer[i] = bytesLeft[i] ^ bytesRight[i];
    }
    return buffer;
}
CCM.prototype.formatAssociatedData = function(){

    var payloadLength = 1;
    
    var value = this.adata.length;
    var buffer = new Uint8Array(CCM.block_size*2 + this.adata.length );
    
    if (this.adata.length == 0) {
        buffer[0] = 0x00;
    }
    else if (this.adata.length <= 0xFEFF) {
        for (var i = 1; i >= 0; i--) {
            buffer[i] = value & 0xFF;
            value = value >> 8;
        }
        payloadLength = 2;
    } else {
        console.log( "Invalid adata length. Should be <= 65279");
    }
    
    var paddingLength = (CCM.block_size- this.adata.length % CCM.block_size) - payloadLength;
    
    for (var i = 0; i < this.adata.length ; i++) {
        buffer[i+payloadLength] = this.adata[i];
    }
    
    for (var i = 0; i < paddingLength; i++) {
        buffer[payloadLength + this.adata.length +i] = 0x00;
    }
    // in case of negative
    if (paddingLength < 0) {
        paddingLength = 0;
    }
    
    buffer = buffer.subarray(0,payloadLength+ this.adata.length+ paddingLength); // or -1
    return buffer;

}

CCM.prototype.AESEncryptBlock = function(blockArray) {
    return FileUtils.base64ToByteArray(CryptoJS.AES.encrypt(CryptoJS.enc.Hex.parse(FileUtils.toHex(blockArray)),
                    CryptoJS.enc.Hex.parse(FileUtils.toHex(this.key)),
                    {mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.NoPadding }).toString());
}
CCM.prototype.encryptBlock = function(bytes) {
    this.bytes_left -= bytes.length;
    var subBlockCount = Math.ceil(bytes.length/CCM.block_size);
    var paddingCount = bytes.length % CCM.block_size;
    for (var i = 0; i < subBlockCount; i++) {
        var subBlockLength = (i === subBlockCount - 1 && paddingCount > 0) ? paddingCount : CCM.block_size;
        //var naplBytesLength = Math.ceil((this.adata.length/CCM.block_size * CCM.block_size)) + 3 * CCM.block_size;
        
        
        var naplBytes = this.formatting_NAP(bytes.subarray(i*CCM.block_size, subBlockLength));
         if (this.exit_next == -1) {
            this.exit_next = 0;
        
            for (var i = 0; i < naplBytes.length; i+= CCM.block_size) {
                
                var xorredArray = this.bytesXorWithBytes(naplBytes.subarray(i*CCM.block_size,i*CCM.block_size + CCM.block_size-1),this.Y);
                
                //console.log("naplBytes.subarray("+(i*CCM.block_size)+","+(i*CCM.block_size + CCM.block_size+")");
                this.Y = this.AESEncryptBlock(xorredArray);
            }
        } else {
            var xorredArray = this.bytesXorWithBytes(naplBytes.subarray(0,naplBytes.length),this.Y);
            this.Y = this.AESEncryptBlock(xorredArray);
        }
            console.log(FileUtils.toHex((this.Y)));
    }
    
}