function CCM(key, iv, adata, tag_length, filesize) {
    this.key = key;
    this.iv = iv;
    this.adata = adata;
    this.tag_length = tag_length;
    this.filesize = filesize;
    this.bytes_left = filesize;
    this.exit_next = -1;
    
    this.CC = new Int8Array(CCM.block_size * CCM.blocks_count);
    this.Y = new Int8Array(CCM.block_size);
    this.S0 = new Int8Array(CCM.block_size);
    
    this.char_ctr = this.generate_counter_block();
    
    
    
    this.char_ctr_cipher = CryptoJS.AES.encrypt(CryptoJS.enc.Hex.parse(FileUtils.toHex(this.char_ctr)),
                                               CryptoJS.enc.Hex.parse(FileUtils.toHex(key)),
                                               {mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.NoPadding });
    
    console.log(FileUtils.toHex(FileUtils.base64ToByteArray(this.char_ctr_cipher.toString())));
    
    for (var i = 0; i < this.Y.length; i++) {
        this.Y[i] = 0x0;
    }
}

CCM.block_size = 16;
CCM.blocks_count = 1024;

CCM.prototype.generate_counter_block = function(buffer) {
    buffer = new Int8Array(CCM.block_size);     
    
    var q_len = 15 - this.iv.length;
    var fl = 0x0;
    
    fl |= (q_len - 1) & 0x07;
    
    buffer[0] = fl;
    
    for (var i = 0; i < this.iv.length; i++) {
        buffer[i+1] = this.iv[i];
    }
    
    for (var i = this.iv.length+1; i < CCM.block_size; i++) {
        buffer[i] = 0x0;
    }
    
    return buffer;
}

CCM.encryptBlock = function(block) {
    
}