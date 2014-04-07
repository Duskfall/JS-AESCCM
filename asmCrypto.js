(function(exports, global) {
    global["asmCrypto"] = exports;
    "use strict";
    function string_to_bytes(str) {
        var i, len = str.length, arr = new Uint8Array(len);
        for (i = 0; i < len; i += 1) {
            arr[i] = str.charCodeAt(i);
        }
        return arr;
    }
    function hex_to_bytes(str) {
        var arr = [], len = str.length, i;
        if (len & 1) {
            str = "0" + str;
            len++;
        }
        for (i = 0; i < len; i += 2) {
            arr.push(parseInt(str.substr(i, 2), 16));
        }
        return new Uint8Array(arr);
    }
    function base64_to_bytes(str) {
        return string_to_bytes(atob(str));
    }
    function bytes_to_string(arr) {
        var str = "";
        for (var i = 0; i < arr.length; i++) str += String.fromCharCode(arr[i]);
        return str;
    }
    function bytes_to_hex(arr) {
        var sz = (arr.byteLength || arr.length) / arr.length, str = "";
        for (var i = 0; i < arr.length; i++) {
            var h = arr[i].toString(16);
            if (h.length < 2 * sz) str += "00000000000000".substr(0, 2 * sz - h.length);
            str += h;
        }
        return str;
    }
    function bytes_to_base64(arr) {
        return btoa(bytes_to_string(arr));
    }
    function pow2_ceil(a) {
        a -= 1;
        a |= a >>> 1;
        a |= a >>> 2;
        a |= a >>> 4;
        a |= a >>> 8;
        a |= a >>> 16;
        a += 1;
        return a;
    }
    function is_number(a) {
        return typeof a === "number";
    }
    function is_string(a) {
        return typeof a === "string";
    }
    function is_buffer(a) {
        return a instanceof ArrayBuffer;
    }
    function is_bytes(a) {
        return a instanceof Uint8Array;
    }
    function IllegalStateError() {
        Error.apply(this, arguments);
    }
    IllegalStateError.prototype = new Error();
    function IllegalArgumentError() {
        Error.apply(this, arguments);
    }
    IllegalArgumentError.prototype = new Error();
    function SecurityError() {
        Error.apply(this, arguments);
    }
    IllegalArgumentError.prototype = new Error();
    var _aes_tables = [ 99, 124, 119, 123, 242, 107, 111, 197, 48, 1, 103, 43, 254, 215, 171, 118, 202, 130, 201, 125, 250, 89, 71, 240, 173, 212, 162, 175, 156, 164, 114, 192, 183, 253, 147, 38, 54, 63, 247, 204, 52, 165, 229, 241, 113, 216, 49, 21, 4, 199, 35, 195, 24, 150, 5, 154, 7, 18, 128, 226, 235, 39, 178, 117, 9, 131, 44, 26, 27, 110, 90, 160, 82, 59, 214, 179, 41, 227, 47, 132, 83, 209, 0, 237, 32, 252, 177, 91, 106, 203, 190, 57, 74, 76, 88, 207, 208, 239, 170, 251, 67, 77, 51, 133, 69, 249, 2, 127, 80, 60, 159, 168, 81, 163, 64, 143, 146, 157, 56, 245, 188, 182, 218, 33, 16, 255, 243, 210, 205, 12, 19, 236, 95, 151, 68, 23, 196, 167, 126, 61, 100, 93, 25, 115, 96, 129, 79, 220, 34, 42, 144, 136, 70, 238, 184, 20, 222, 94, 11, 219, 224, 50, 58, 10, 73, 6, 36, 92, 194, 211, 172, 98, 145, 149, 228, 121, 231, 200, 55, 109, 141, 213, 78, 169, 108, 86, 244, 234, 101, 122, 174, 8, 186, 120, 37, 46, 28, 166, 180, 198, 232, 221, 116, 31, 75, 189, 139, 138, 112, 62, 181, 102, 72, 3, 246, 14, 97, 53, 87, 185, 134, 193, 29, 158, 225, 248, 152, 17, 105, 217, 142, 148, 155, 30, 135, 233, 206, 85, 40, 223, 140, 161, 137, 13, 191, 230, 66, 104, 65, 153, 45, 15, 176, 84, 187, 22, 82, 9, 106, 213, 48, 54, 165, 56, 191, 64, 163, 158, 129, 243, 215, 251, 124, 227, 57, 130, 155, 47, 255, 135, 52, 142, 67, 68, 196, 222, 233, 203, 84, 123, 148, 50, 166, 194, 35, 61, 238, 76, 149, 11, 66, 250, 195, 78, 8, 46, 161, 102, 40, 217, 36, 178, 118, 91, 162, 73, 109, 139, 209, 37, 114, 248, 246, 100, 134, 104, 152, 22, 212, 164, 92, 204, 93, 101, 182, 146, 108, 112, 72, 80, 253, 237, 185, 218, 94, 21, 70, 87, 167, 141, 157, 132, 144, 216, 171, 0, 140, 188, 211, 10, 247, 228, 88, 5, 184, 179, 69, 6, 208, 44, 30, 143, 202, 63, 15, 2, 193, 175, 189, 3, 1, 19, 138, 107, 58, 145, 17, 65, 79, 103, 220, 234, 151, 242, 207, 206, 240, 180, 230, 115, 150, 172, 116, 34, 231, 173, 53, 133, 226, 249, 55, 232, 28, 117, 223, 110, 71, 241, 26, 113, 29, 41, 197, 137, 111, 183, 98, 14, 170, 24, 190, 27, 252, 86, 62, 75, 198, 210, 121, 32, 154, 219, 192, 254, 120, 205, 90, 244, 31, 221, 168, 51, 136, 7, 199, 49, 177, 18, 16, 89, 39, 128, 236, 95, 96, 81, 127, 169, 25, 181, 74, 13, 45, 229, 122, 159, 147, 201, 156, 239, 160, 224, 59, 77, 174, 42, 245, 176, 200, 235, 187, 60, 131, 83, 153, 97, 23, 43, 4, 126, 186, 119, 214, 38, 225, 105, 20, 99, 85, 33, 12, 125, 198, 248, 238, 246, 255, 214, 222, 145, 96, 2, 206, 86, 231, 181, 77, 236, 143, 31, 137, 250, 239, 178, 142, 251, 65, 179, 95, 69, 35, 83, 228, 155, 117, 225, 61, 76, 108, 126, 245, 131, 104, 81, 209, 249, 226, 171, 98, 42, 8, 149, 70, 157, 48, 55, 10, 47, 14, 36, 27, 223, 205, 78, 127, 234, 18, 29, 88, 52, 54, 220, 180, 91, 164, 118, 183, 125, 82, 221, 94, 19, 166, 185, 0, 193, 64, 227, 121, 182, 212, 141, 103, 114, 148, 152, 176, 133, 187, 197, 79, 237, 134, 154, 102, 17, 138, 233, 4, 254, 160, 120, 37, 75, 162, 93, 128, 5, 63, 33, 112, 241, 99, 119, 175, 66, 32, 229, 253, 191, 129, 24, 38, 195, 190, 53, 136, 46, 147, 85, 252, 122, 200, 186, 50, 230, 192, 25, 158, 163, 68, 84, 59, 11, 140, 199, 107, 40, 167, 188, 22, 173, 219, 100, 116, 20, 146, 12, 72, 184, 159, 189, 67, 196, 57, 49, 211, 242, 213, 139, 110, 218, 1, 177, 156, 73, 216, 172, 243, 207, 202, 244, 71, 16, 111, 240, 74, 92, 56, 87, 115, 151, 203, 161, 232, 62, 150, 97, 13, 15, 224, 124, 113, 204, 144, 6, 247, 28, 194, 106, 174, 105, 23, 153, 58, 39, 217, 235, 43, 34, 210, 169, 7, 51, 45, 60, 21, 201, 135, 170, 80, 165, 3, 89, 9, 26, 101, 215, 132, 208, 130, 41, 90, 30, 123, 168, 109, 44, 165, 132, 153, 141, 13, 189, 177, 84, 80, 3, 169, 125, 25, 98, 230, 154, 69, 157, 64, 135, 21, 235, 201, 11, 236, 103, 253, 234, 191, 247, 150, 91, 194, 28, 174, 106, 90, 65, 2, 79, 92, 244, 52, 8, 147, 115, 83, 63, 12, 82, 101, 94, 40, 161, 15, 181, 9, 54, 155, 61, 38, 105, 205, 159, 27, 158, 116, 46, 45, 178, 238, 251, 246, 77, 97, 206, 123, 62, 113, 151, 245, 104, 0, 44, 96, 31, 200, 237, 190, 70, 217, 75, 222, 212, 232, 74, 107, 42, 229, 22, 197, 215, 85, 148, 207, 16, 6, 129, 240, 68, 186, 227, 243, 254, 192, 138, 173, 188, 72, 4, 223, 193, 117, 99, 
48, 26, 14, 109, 76, 20, 53, 47, 225, 162, 204, 57, 87, 242, 130, 71, 172, 231, 43, 149, 160, 152, 209, 127, 102, 126, 171, 131, 202, 41, 211, 60, 121, 226, 29, 118, 59, 86, 78, 30, 219, 10, 108, 228, 93, 110, 239, 166, 168, 164, 55, 139, 50, 67, 89, 183, 140, 100, 210, 224, 180, 250, 7, 37, 175, 142, 233, 24, 213, 136, 111, 114, 36, 241, 199, 81, 35, 124, 156, 33, 221, 220, 134, 133, 144, 66, 196, 170, 216, 5, 1, 18, 163, 95, 249, 208, 145, 88, 39, 185, 56, 19, 179, 51, 187, 112, 137, 167, 182, 34, 146, 32, 73, 255, 120, 122, 143, 248, 128, 23, 218, 49, 198, 184, 195, 176, 119, 17, 203, 252, 214, 58, 0, 9, 18, 27, 36, 45, 54, 63, 72, 65, 90, 83, 108, 101, 126, 119, 144, 153, 130, 139, 180, 189, 166, 175, 216, 209, 202, 195, 252, 245, 238, 231, 59, 50, 41, 32, 31, 22, 13, 4, 115, 122, 97, 104, 87, 94, 69, 76, 171, 162, 185, 176, 143, 134, 157, 148, 227, 234, 241, 248, 199, 206, 213, 220, 118, 127, 100, 109, 82, 91, 64, 73, 62, 55, 44, 37, 26, 19, 8, 1, 230, 239, 244, 253, 194, 203, 208, 217, 174, 167, 188, 181, 138, 131, 152, 145, 77, 68, 95, 86, 105, 96, 123, 114, 5, 12, 23, 30, 33, 40, 51, 58, 221, 212, 207, 198, 249, 240, 235, 226, 149, 156, 135, 142, 177, 184, 163, 170, 236, 229, 254, 247, 200, 193, 218, 211, 164, 173, 182, 191, 128, 137, 146, 155, 124, 117, 110, 103, 88, 81, 74, 67, 52, 61, 38, 47, 16, 25, 2, 11, 215, 222, 197, 204, 243, 250, 225, 232, 159, 150, 141, 132, 187, 178, 169, 160, 71, 78, 85, 92, 99, 106, 113, 120, 15, 6, 29, 20, 43, 34, 57, 48, 154, 147, 136, 129, 190, 183, 172, 165, 210, 219, 192, 201, 246, 255, 228, 237, 10, 3, 24, 17, 46, 39, 60, 53, 66, 75, 80, 89, 102, 111, 116, 125, 161, 168, 179, 186, 133, 140, 151, 158, 233, 224, 251, 242, 205, 196, 223, 214, 49, 56, 35, 42, 21, 28, 7, 14, 121, 112, 107, 98, 93, 84, 79, 70, 0, 11, 22, 29, 44, 39, 58, 49, 88, 83, 78, 69, 116, 127, 98, 105, 176, 187, 166, 173, 156, 151, 138, 129, 232, 227, 254, 245, 196, 207, 210, 217, 123, 112, 109, 102, 87, 92, 65, 74, 35, 40, 53, 62, 15, 4, 25, 18, 203, 192, 221, 214, 231, 236, 241, 250, 147, 152, 133, 142, 191, 180, 169, 162, 246, 253, 224, 235, 218, 209, 204, 199, 174, 165, 184, 179, 130, 137, 148, 159, 70, 77, 80, 91, 106, 97, 124, 119, 30, 21, 8, 3, 50, 57, 36, 47, 141, 134, 155, 144, 161, 170, 183, 188, 213, 222, 195, 200, 249, 242, 239, 228, 61, 54, 43, 32, 17, 26, 7, 12, 101, 110, 115, 120, 73, 66, 95, 84, 247, 252, 225, 234, 219, 208, 205, 198, 175, 164, 185, 178, 131, 136, 149, 158, 71, 76, 81, 90, 107, 96, 125, 118, 31, 20, 9, 2, 51, 56, 37, 46, 140, 135, 154, 145, 160, 171, 182, 189, 212, 223, 194, 201, 248, 243, 238, 229, 60, 55, 42, 33, 16, 27, 6, 13, 100, 111, 114, 121, 72, 67, 94, 85, 1, 10, 23, 28, 45, 38, 59, 48, 89, 82, 79, 68, 117, 126, 99, 104, 177, 186, 167, 172, 157, 150, 139, 128, 233, 226, 255, 244, 197, 206, 211, 216, 122, 113, 108, 103, 86, 93, 64, 75, 34, 41, 52, 63, 14, 5, 24, 19, 202, 193, 220, 215, 230, 237, 240, 251, 146, 153, 132, 143, 190, 181, 168, 163, 0, 13, 26, 23, 52, 57, 46, 35, 104, 101, 114, 127, 92, 81, 70, 75, 208, 221, 202, 199, 228, 233, 254, 243, 184, 181, 162, 175, 140, 129, 150, 155, 187, 182, 161, 172, 143, 130, 149, 152, 211, 222, 201, 196, 231, 234, 253, 240, 107, 102, 113, 124, 95, 82, 69, 72, 3, 14, 25, 20, 55, 58, 45, 32, 109, 96, 119, 122, 89, 84, 67, 78, 5, 8, 31, 18, 49, 60, 43, 38, 189, 176, 167, 170, 137, 132, 147, 158, 213, 216, 207, 194, 225, 236, 251, 246, 214, 219, 204, 193, 226, 239, 248, 245, 190, 179, 164, 169, 138, 135, 144, 157, 6, 11, 28, 17, 50, 63, 40, 37, 110, 99, 116, 121, 90, 87, 64, 77, 218, 215, 192, 205, 238, 227, 244, 249, 178, 191, 168, 165, 134, 139, 156, 145, 10, 7, 16, 29, 62, 51, 36, 41, 98, 111, 120, 117, 86, 91, 76, 65, 97, 108, 123, 118, 85, 88, 79, 66, 9, 4, 19, 30, 61, 48, 39, 42, 177, 188, 171, 166, 133, 136, 159, 146, 217, 212, 195, 206, 237, 224, 247, 250, 183, 186, 173, 160, 131, 142, 153, 148, 223, 210, 197, 200, 235, 230, 241, 252, 103, 106, 125, 112, 83, 94, 73, 68, 15, 2, 21, 24, 59, 54, 33, 44, 12, 1, 22, 27, 56, 53, 34, 47, 100, 105, 126, 115, 80, 93, 74, 71, 220, 209, 198, 203, 232, 229, 242, 255, 180, 185, 174, 
163, 128, 141, 154, 151, 0, 14, 28, 18, 56, 54, 36, 42, 112, 126, 108, 98, 72, 70, 84, 90, 224, 238, 252, 242, 216, 214, 196, 202, 144, 158, 140, 130, 168, 166, 180, 186, 219, 213, 199, 201, 227, 237, 255, 241, 171, 165, 183, 185, 147, 157, 143, 129, 59, 53, 39, 41, 3, 13, 31, 17, 75, 69, 87, 89, 115, 125, 111, 97, 173, 163, 177, 191, 149, 155, 137, 135, 221, 211, 193, 207, 229, 235, 249, 247, 77, 67, 81, 95, 117, 123, 105, 103, 61, 51, 33, 47, 5, 11, 25, 23, 118, 120, 106, 100, 78, 64, 82, 92, 6, 8, 26, 20, 62, 48, 34, 44, 150, 152, 138, 132, 174, 160, 178, 188, 230, 232, 250, 244, 222, 208, 194, 204, 65, 79, 93, 83, 121, 119, 101, 107, 49, 63, 45, 35, 9, 7, 21, 27, 161, 175, 189, 179, 153, 151, 133, 139, 209, 223, 205, 195, 233, 231, 245, 251, 154, 148, 134, 136, 162, 172, 190, 176, 234, 228, 246, 248, 210, 220, 206, 192, 122, 116, 102, 104, 66, 76, 94, 80, 10, 4, 22, 24, 50, 60, 46, 32, 236, 226, 240, 254, 212, 218, 200, 198, 156, 146, 128, 142, 164, 170, 184, 182, 12, 2, 16, 30, 52, 58, 40, 38, 124, 114, 96, 110, 68, 74, 88, 86, 55, 57, 43, 37, 15, 1, 19, 29, 71, 73, 91, 85, 127, 113, 99, 109, 215, 217, 203, 197, 239, 225, 243, 253, 167, 169, 187, 181, 159, 145, 131, 141 ];
    var _aes_heap_start = 2048;
    function _aes_asm(stdlib, foreign, buffer) {
        "use asm";
        var S0 = 0, S1 = 0, S2 = 0, S3 = 0, S4 = 0, S5 = 0, S6 = 0, S7 = 0, S8 = 0, S9 = 0, SA = 0, SB = 0, SC = 0, SD = 0, SE = 0, SF = 0;
        var R00 = 0, R01 = 0, R02 = 0, R03 = 0, R04 = 0, R05 = 0, R06 = 0, R07 = 0, R08 = 0, R09 = 0, R0A = 0, R0B = 0, R0C = 0, R0D = 0, R0E = 0, R0F = 0, R10 = 0, R11 = 0, R12 = 0, R13 = 0, R14 = 0, R15 = 0, R16 = 0, R17 = 0, R18 = 0, R19 = 0, R1A = 0, R1B = 0, R1C = 0, R1D = 0, R1E = 0, R1F = 0, R20 = 0, R21 = 0, R22 = 0, R23 = 0, R24 = 0, R25 = 0, R26 = 0, R27 = 0, R28 = 0, R29 = 0, R2A = 0, R2B = 0, R2C = 0, R2D = 0, R2E = 0, R2F = 0, R30 = 0, R31 = 0, R32 = 0, R33 = 0, R34 = 0, R35 = 0, R36 = 0, R37 = 0, R38 = 0, R39 = 0, R3A = 0, R3B = 0, R3C = 0, R3D = 0, R3E = 0, R3F = 0, R40 = 0, R41 = 0, R42 = 0, R43 = 0, R44 = 0, R45 = 0, R46 = 0, R47 = 0, R48 = 0, R49 = 0, R4A = 0, R4B = 0, R4C = 0, R4D = 0, R4E = 0, R4F = 0, R50 = 0, R51 = 0, R52 = 0, R53 = 0, R54 = 0, R55 = 0, R56 = 0, R57 = 0, R58 = 0, R59 = 0, R5A = 0, R5B = 0, R5C = 0, R5D = 0, R5E = 0, R5F = 0, R60 = 0, R61 = 0, R62 = 0, R63 = 0, R64 = 0, R65 = 0, R66 = 0, R67 = 0, R68 = 0, R69 = 0, R6A = 0, R6B = 0, R6C = 0, R6D = 0, R6E = 0, R6F = 0, R70 = 0, R71 = 0, R72 = 0, R73 = 0, R74 = 0, R75 = 0, R76 = 0, R77 = 0, R78 = 0, R79 = 0, R7A = 0, R7B = 0, R7C = 0, R7D = 0, R7E = 0, R7F = 0, R80 = 0, R81 = 0, R82 = 0, R83 = 0, R84 = 0, R85 = 0, R86 = 0, R87 = 0, R88 = 0, R89 = 0, R8A = 0, R8B = 0, R8C = 0, R8D = 0, R8E = 0, R8F = 0, R90 = 0, R91 = 0, R92 = 0, R93 = 0, R94 = 0, R95 = 0, R96 = 0, R97 = 0, R98 = 0, R99 = 0, R9A = 0, R9B = 0, R9C = 0, R9D = 0, R9E = 0, R9F = 0, RA0 = 0, RA1 = 0, RA2 = 0, RA3 = 0, RA4 = 0, RA5 = 0, RA6 = 0, RA7 = 0, RA8 = 0, RA9 = 0, RAA = 0, RAB = 0, RAC = 0, RAD = 0, RAE = 0, RAF = 0;
        var HEAP = new stdlib.Uint8Array(buffer);
        function _expand_key_128() {
            var sbox = 0;
            R10 = R00 ^ HEAP[sbox | R0D] ^ 1;
            R11 = R01 ^ HEAP[sbox | R0E];
            R12 = R02 ^ HEAP[sbox | R0F];
            R13 = R03 ^ HEAP[sbox | R0C];
            R14 = R04 ^ R10;
            R15 = R05 ^ R11;
            R16 = R06 ^ R12;
            R17 = R07 ^ R13;
            R18 = R08 ^ R14;
            R19 = R09 ^ R15;
            R1A = R0A ^ R16;
            R1B = R0B ^ R17;
            R1C = R0C ^ R18;
            R1D = R0D ^ R19;
            R1E = R0E ^ R1A;
            R1F = R0F ^ R1B;
            R20 = R10 ^ HEAP[sbox | R1D] ^ 2;
            R21 = R11 ^ HEAP[sbox | R1E];
            R22 = R12 ^ HEAP[sbox | R1F];
            R23 = R13 ^ HEAP[sbox | R1C];
            R24 = R14 ^ R20;
            R25 = R15 ^ R21;
            R26 = R16 ^ R22;
            R27 = R17 ^ R23;
            R28 = R18 ^ R24;
            R29 = R19 ^ R25;
            R2A = R1A ^ R26;
            R2B = R1B ^ R27;
            R2C = R1C ^ R28;
            R2D = R1D ^ R29;
            R2E = R1E ^ R2A;
            R2F = R1F ^ R2B;
            R30 = R20 ^ HEAP[sbox | R2D] ^ 4;
            R31 = R21 ^ HEAP[sbox | R2E];
            R32 = R22 ^ HEAP[sbox | R2F];
            R33 = R23 ^ HEAP[sbox | R2C];
            R34 = R24 ^ R30;
            R35 = R25 ^ R31;
            R36 = R26 ^ R32;
            R37 = R27 ^ R33;
            R38 = R28 ^ R34;
            R39 = R29 ^ R35;
            R3A = R2A ^ R36;
            R3B = R2B ^ R37;
            R3C = R2C ^ R38;
            R3D = R2D ^ R39;
            R3E = R2E ^ R3A;
            R3F = R2F ^ R3B;
            R40 = R30 ^ HEAP[sbox | R3D] ^ 8;
            R41 = R31 ^ HEAP[sbox | R3E];
            R42 = R32 ^ HEAP[sbox | R3F];
            R43 = R33 ^ HEAP[sbox | R3C];
            R44 = R34 ^ R40;
            R45 = R35 ^ R41;
            R46 = R36 ^ R42;
            R47 = R37 ^ R43;
            R48 = R38 ^ R44;
            R49 = R39 ^ R45;
            R4A = R3A ^ R46;
            R4B = R3B ^ R47;
            R4C = R3C ^ R48;
            R4D = R3D ^ R49;
            R4E = R3E ^ R4A;
            R4F = R3F ^ R4B;
            R50 = R40 ^ HEAP[sbox | R4D] ^ 16;
            R51 = R41 ^ HEAP[sbox | R4E];
            R52 = R42 ^ HEAP[sbox | R4F];
            R53 = R43 ^ HEAP[sbox | R4C];
            R54 = R44 ^ R50;
            R55 = R45 ^ R51;
            R56 = R46 ^ R52;
            R57 = R47 ^ R53;
            R58 = R48 ^ R54;
            R59 = R49 ^ R55;
            R5A = R4A ^ R56;
            R5B = R4B ^ R57;
            R5C = R4C ^ R58;
            R5D = R4D ^ R59;
            R5E = R4E ^ R5A;
            R5F = R4F ^ R5B;
            R60 = R50 ^ HEAP[sbox | R5D] ^ 32;
            R61 = R51 ^ HEAP[sbox | R5E];
            R62 = R52 ^ HEAP[sbox | R5F];
            R63 = R53 ^ HEAP[sbox | R5C];
            R64 = R54 ^ R60;
            R65 = R55 ^ R61;
            R66 = R56 ^ R62;
            R67 = R57 ^ R63;
            R68 = R58 ^ R64;
            R69 = R59 ^ R65;
            R6A = R5A ^ R66;
            R6B = R5B ^ R67;
            R6C = R5C ^ R68;
            R6D = R5D ^ R69;
            R6E = R5E ^ R6A;
            R6F = R5F ^ R6B;
            R70 = R60 ^ HEAP[sbox | R6D] ^ 64;
            R71 = R61 ^ HEAP[sbox | R6E];
            R72 = R62 ^ HEAP[sbox | R6F];
            R73 = R63 ^ HEAP[sbox | R6C];
            R74 = R64 ^ R70;
            R75 = R65 ^ R71;
            R76 = R66 ^ R72;
            R77 = R67 ^ R73;
            R78 = R68 ^ R74;
            R79 = R69 ^ R75;
            R7A = R6A ^ R76;
            R7B = R6B ^ R77;
            R7C = R6C ^ R78;
            R7D = R6D ^ R79;
            R7E = R6E ^ R7A;
            R7F = R6F ^ R7B;
            R80 = R70 ^ HEAP[sbox | R7D] ^ 128;
            R81 = R71 ^ HEAP[sbox | R7E];
            R82 = R72 ^ HEAP[sbox | R7F];
            R83 = R73 ^ HEAP[sbox | R7C];
            R84 = R74 ^ R80;
            R85 = R75 ^ R81;
            R86 = R76 ^ R82;
            R87 = R77 ^ R83;
            R88 = R78 ^ R84;
            R89 = R79 ^ R85;
            R8A = R7A ^ R86;
            R8B = R7B ^ R87;
            R8C = R7C ^ R88;
            R8D = R7D ^ R89;
            R8E = R7E ^ R8A;
            R8F = R7F ^ R8B;
            R90 = R80 ^ HEAP[sbox | R8D] ^ 27;
            R91 = R81 ^ HEAP[sbox | R8E];
            R92 = R82 ^ HEAP[sbox | R8F];
            R93 = R83 ^ HEAP[sbox | R8C];
            R94 = R84 ^ R90;
            R95 = R85 ^ R91;
            R96 = R86 ^ R92;
            R97 = R87 ^ R93;
            R98 = R88 ^ R94;
            R99 = R89 ^ R95;
            R9A = R8A ^ R96;
            R9B = R8B ^ R97;
            R9C = R8C ^ R98;
            R9D = R8D ^ R99;
            R9E = R8E ^ R9A;
            R9F = R8F ^ R9B;
            RA0 = R90 ^ HEAP[sbox | R9D] ^ 54;
            RA1 = R91 ^ HEAP[sbox | R9E];
            RA2 = R92 ^ HEAP[sbox | R9F];
            RA3 = R93 ^ HEAP[sbox | R9C];
            RA4 = R94 ^ RA0;
            RA5 = R95 ^ RA1;
            RA6 = R96 ^ RA2;
            RA7 = R97 ^ RA3;
            RA8 = R98 ^ RA4;
            RA9 = R99 ^ RA5;
            RAA = R9A ^ RA6;
            RAB = R9B ^ RA7;
            RAC = R9C ^ RA8;
            RAD = R9D ^ RA9;
            RAE = R9E ^ RAA;
            RAF = R9F ^ RAB;
        }
        function _encrypt_128(s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, sA, sB, sC, sD, sE, sF) {
            s0 = s0 | 0;
            s1 = s1 | 0;
            s2 = s2 | 0;
            s3 = s3 | 0;
            s4 = s4 | 0;
            s5 = s5 | 0;
            s6 = s6 | 0;
            s7 = s7 | 0;
            s8 = s8 | 0;
            s9 = s9 | 0;
            sA = sA | 0;
            sB = sB | 0;
            sC = sC | 0;
            sD = sD | 0;
            sE = sE | 0;
            sF = sF | 0;
            var t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0, tA = 0, tB = 0, tC = 0, tD = 0, tE = 0, tF = 0, sbox = 0, x2_sbox = 512, x3_sbox = 768;
            s0 = s0 ^ R00;
            s1 = s1 ^ R01;
            s2 = s2 ^ R02;
            s3 = s3 ^ R03;
            s4 = s4 ^ R04;
            s5 = s5 ^ R05;
            s6 = s6 ^ R06;
            s7 = s7 ^ R07;
            s8 = s8 ^ R08;
            s9 = s9 ^ R09;
            sA = sA ^ R0A;
            sB = sB ^ R0B;
            sC = sC ^ R0C;
            sD = sD ^ R0D;
            sE = sE ^ R0E;
            sF = sF ^ R0F;
            t0 = HEAP[x2_sbox | s0] ^ HEAP[x3_sbox | s5] ^ HEAP[sbox | sA] ^ HEAP[sbox | sF] ^ R10;
            t1 = HEAP[sbox | s0] ^ HEAP[x2_sbox | s5] ^ HEAP[x3_sbox | sA] ^ HEAP[sbox | sF] ^ R11;
            t2 = HEAP[sbox | s0] ^ HEAP[sbox | s5] ^ HEAP[x2_sbox | sA] ^ HEAP[x3_sbox | sF] ^ R12;
            t3 = HEAP[x3_sbox | s0] ^ HEAP[sbox | s5] ^ HEAP[sbox | sA] ^ HEAP[x2_sbox | sF] ^ R13;
            t4 = HEAP[x2_sbox | s4] ^ HEAP[x3_sbox | s9] ^ HEAP[sbox | sE] ^ HEAP[sbox | s3] ^ R14;
            t5 = HEAP[sbox | s4] ^ HEAP[x2_sbox | s9] ^ HEAP[x3_sbox | sE] ^ HEAP[sbox | s3] ^ R15;
            t6 = HEAP[sbox | s4] ^ HEAP[sbox | s9] ^ HEAP[x2_sbox | sE] ^ HEAP[x3_sbox | s3] ^ R16;
            t7 = HEAP[x3_sbox | s4] ^ HEAP[sbox | s9] ^ HEAP[sbox | sE] ^ HEAP[x2_sbox | s3] ^ R17;
            t8 = HEAP[x2_sbox | s8] ^ HEAP[x3_sbox | sD] ^ HEAP[sbox | s2] ^ HEAP[sbox | s7] ^ R18;
            t9 = HEAP[sbox | s8] ^ HEAP[x2_sbox | sD] ^ HEAP[x3_sbox | s2] ^ HEAP[sbox | s7] ^ R19;
            tA = HEAP[sbox | s8] ^ HEAP[sbox | sD] ^ HEAP[x2_sbox | s2] ^ HEAP[x3_sbox | s7] ^ R1A;
            tB = HEAP[x3_sbox | s8] ^ HEAP[sbox | sD] ^ HEAP[sbox | s2] ^ HEAP[x2_sbox | s7] ^ R1B;
            tC = HEAP[x2_sbox | sC] ^ HEAP[x3_sbox | s1] ^ HEAP[sbox | s6] ^ HEAP[sbox | sB] ^ R1C;
            tD = HEAP[sbox | sC] ^ HEAP[x2_sbox | s1] ^ HEAP[x3_sbox | s6] ^ HEAP[sbox | sB] ^ R1D;
            tE = HEAP[sbox | sC] ^ HEAP[sbox | s1] ^ HEAP[x2_sbox | s6] ^ HEAP[x3_sbox | sB] ^ R1E;
            tF = HEAP[x3_sbox | sC] ^ HEAP[sbox | s1] ^ HEAP[sbox | s6] ^ HEAP[x2_sbox | sB] ^ R1F;
            s0 = HEAP[x2_sbox | t0] ^ HEAP[x3_sbox | t5] ^ HEAP[sbox | tA] ^ HEAP[sbox | tF] ^ R20;
            s1 = HEAP[sbox | t0] ^ HEAP[x2_sbox | t5] ^ HEAP[x3_sbox | tA] ^ HEAP[sbox | tF] ^ R21;
            s2 = HEAP[sbox | t0] ^ HEAP[sbox | t5] ^ HEAP[x2_sbox | tA] ^ HEAP[x3_sbox | tF] ^ R22;
            s3 = HEAP[x3_sbox | t0] ^ HEAP[sbox | t5] ^ HEAP[sbox | tA] ^ HEAP[x2_sbox | tF] ^ R23;
            s4 = HEAP[x2_sbox | t4] ^ HEAP[x3_sbox | t9] ^ HEAP[sbox | tE] ^ HEAP[sbox | t3] ^ R24;
            s5 = HEAP[sbox | t4] ^ HEAP[x2_sbox | t9] ^ HEAP[x3_sbox | tE] ^ HEAP[sbox | t3] ^ R25;
            s6 = HEAP[sbox | t4] ^ HEAP[sbox | t9] ^ HEAP[x2_sbox | tE] ^ HEAP[x3_sbox | t3] ^ R26;
            s7 = HEAP[x3_sbox | t4] ^ HEAP[sbox | t9] ^ HEAP[sbox | tE] ^ HEAP[x2_sbox | t3] ^ R27;
            s8 = HEAP[x2_sbox | t8] ^ HEAP[x3_sbox | tD] ^ HEAP[sbox | t2] ^ HEAP[sbox | t7] ^ R28;
            s9 = HEAP[sbox | t8] ^ HEAP[x2_sbox | tD] ^ HEAP[x3_sbox | t2] ^ HEAP[sbox | t7] ^ R29;
            sA = HEAP[sbox | t8] ^ HEAP[sbox | tD] ^ HEAP[x2_sbox | t2] ^ HEAP[x3_sbox | t7] ^ R2A;
            sB = HEAP[x3_sbox | t8] ^ HEAP[sbox | tD] ^ HEAP[sbox | t2] ^ HEAP[x2_sbox | t7] ^ R2B;
            sC = HEAP[x2_sbox | tC] ^ HEAP[x3_sbox | t1] ^ HEAP[sbox | t6] ^ HEAP[sbox | tB] ^ R2C;
            sD = HEAP[sbox | tC] ^ HEAP[x2_sbox | t1] ^ HEAP[x3_sbox | t6] ^ HEAP[sbox | tB] ^ R2D;
            sE = HEAP[sbox | tC] ^ HEAP[sbox | t1] ^ HEAP[x2_sbox | t6] ^ HEAP[x3_sbox | tB] ^ R2E;
            sF = HEAP[x3_sbox | tC] ^ HEAP[sbox | t1] ^ HEAP[sbox | t6] ^ HEAP[x2_sbox | tB] ^ R2F;
            t0 = HEAP[x2_sbox | s0] ^ HEAP[x3_sbox | s5] ^ HEAP[sbox | sA] ^ HEAP[sbox | sF] ^ R30;
            t1 = HEAP[sbox | s0] ^ HEAP[x2_sbox | s5] ^ HEAP[x3_sbox | sA] ^ HEAP[sbox | sF] ^ R31;
            t2 = HEAP[sbox | s0] ^ HEAP[sbox | s5] ^ HEAP[x2_sbox | sA] ^ HEAP[x3_sbox | sF] ^ R32;
            t3 = HEAP[x3_sbox | s0] ^ HEAP[sbox | s5] ^ HEAP[sbox | sA] ^ HEAP[x2_sbox | sF] ^ R33;
            t4 = HEAP[x2_sbox | s4] ^ HEAP[x3_sbox | s9] ^ HEAP[sbox | sE] ^ HEAP[sbox | s3] ^ R34;
            t5 = HEAP[sbox | s4] ^ HEAP[x2_sbox | s9] ^ HEAP[x3_sbox | sE] ^ HEAP[sbox | s3] ^ R35;
            t6 = HEAP[sbox | s4] ^ HEAP[sbox | s9] ^ HEAP[x2_sbox | sE] ^ HEAP[x3_sbox | s3] ^ R36;
            t7 = HEAP[x3_sbox | s4] ^ HEAP[sbox | s9] ^ HEAP[sbox | sE] ^ HEAP[x2_sbox | s3] ^ R37;
            t8 = HEAP[x2_sbox | s8] ^ HEAP[x3_sbox | sD] ^ HEAP[sbox | s2] ^ HEAP[sbox | s7] ^ R38;
            t9 = HEAP[sbox | s8] ^ HEAP[x2_sbox | sD] ^ HEAP[x3_sbox | s2] ^ HEAP[sbox | s7] ^ R39;
            tA = HEAP[sbox | s8] ^ HEAP[sbox | sD] ^ HEAP[x2_sbox | s2] ^ HEAP[x3_sbox | s7] ^ R3A;
            tB = HEAP[x3_sbox | s8] ^ HEAP[sbox | sD] ^ HEAP[sbox | s2] ^ HEAP[x2_sbox | s7] ^ R3B;
            tC = HEAP[x2_sbox | sC] ^ HEAP[x3_sbox | s1] ^ HEAP[sbox | s6] ^ HEAP[sbox | sB] ^ R3C;
            tD = HEAP[sbox | sC] ^ HEAP[x2_sbox | s1] ^ HEAP[x3_sbox | s6] ^ HEAP[sbox | sB] ^ R3D;
            tE = HEAP[sbox | sC] ^ HEAP[sbox | s1] ^ HEAP[x2_sbox | s6] ^ HEAP[x3_sbox | sB] ^ R3E;
            tF = HEAP[x3_sbox | sC] ^ HEAP[sbox | s1] ^ HEAP[sbox | s6] ^ HEAP[x2_sbox | sB] ^ R3F;
            s0 = HEAP[x2_sbox | t0] ^ HEAP[x3_sbox | t5] ^ HEAP[sbox | tA] ^ HEAP[sbox | tF] ^ R40;
            s1 = HEAP[sbox | t0] ^ HEAP[x2_sbox | t5] ^ HEAP[x3_sbox | tA] ^ HEAP[sbox | tF] ^ R41;
            s2 = HEAP[sbox | t0] ^ HEAP[sbox | t5] ^ HEAP[x2_sbox | tA] ^ HEAP[x3_sbox | tF] ^ R42;
            s3 = HEAP[x3_sbox | t0] ^ HEAP[sbox | t5] ^ HEAP[sbox | tA] ^ HEAP[x2_sbox | tF] ^ R43;
            s4 = HEAP[x2_sbox | t4] ^ HEAP[x3_sbox | t9] ^ HEAP[sbox | tE] ^ HEAP[sbox | t3] ^ R44;
            s5 = HEAP[sbox | t4] ^ HEAP[x2_sbox | t9] ^ HEAP[x3_sbox | tE] ^ HEAP[sbox | t3] ^ R45;
            s6 = HEAP[sbox | t4] ^ HEAP[sbox | t9] ^ HEAP[x2_sbox | tE] ^ HEAP[x3_sbox | t3] ^ R46;
            s7 = HEAP[x3_sbox | t4] ^ HEAP[sbox | t9] ^ HEAP[sbox | tE] ^ HEAP[x2_sbox | t3] ^ R47;
            s8 = HEAP[x2_sbox | t8] ^ HEAP[x3_sbox | tD] ^ HEAP[sbox | t2] ^ HEAP[sbox | t7] ^ R48;
            s9 = HEAP[sbox | t8] ^ HEAP[x2_sbox | tD] ^ HEAP[x3_sbox | t2] ^ HEAP[sbox | t7] ^ R49;
            sA = HEAP[sbox | t8] ^ HEAP[sbox | tD] ^ HEAP[x2_sbox | t2] ^ HEAP[x3_sbox | t7] ^ R4A;
            sB = HEAP[x3_sbox | t8] ^ HEAP[sbox | tD] ^ HEAP[sbox | t2] ^ HEAP[x2_sbox | t7] ^ R4B;
            sC = HEAP[x2_sbox | tC] ^ HEAP[x3_sbox | t1] ^ HEAP[sbox | t6] ^ HEAP[sbox | tB] ^ R4C;
            sD = HEAP[sbox | tC] ^ HEAP[x2_sbox | t1] ^ HEAP[x3_sbox | t6] ^ HEAP[sbox | tB] ^ R4D;
            sE = HEAP[sbox | tC] ^ HEAP[sbox | t1] ^ HEAP[x2_sbox | t6] ^ HEAP[x3_sbox | tB] ^ R4E;
            sF = HEAP[x3_sbox | tC] ^ HEAP[sbox | t1] ^ HEAP[sbox | t6] ^ HEAP[x2_sbox | tB] ^ R4F;
            t0 = HEAP[x2_sbox | s0] ^ HEAP[x3_sbox | s5] ^ HEAP[sbox | sA] ^ HEAP[sbox | sF] ^ R50;
            t1 = HEAP[sbox | s0] ^ HEAP[x2_sbox | s5] ^ HEAP[x3_sbox | sA] ^ HEAP[sbox | sF] ^ R51;
            t2 = HEAP[sbox | s0] ^ HEAP[sbox | s5] ^ HEAP[x2_sbox | sA] ^ HEAP[x3_sbox | sF] ^ R52;
            t3 = HEAP[x3_sbox | s0] ^ HEAP[sbox | s5] ^ HEAP[sbox | sA] ^ HEAP[x2_sbox | sF] ^ R53;
            t4 = HEAP[x2_sbox | s4] ^ HEAP[x3_sbox | s9] ^ HEAP[sbox | sE] ^ HEAP[sbox | s3] ^ R54;
            t5 = HEAP[sbox | s4] ^ HEAP[x2_sbox | s9] ^ HEAP[x3_sbox | sE] ^ HEAP[sbox | s3] ^ R55;
            t6 = HEAP[sbox | s4] ^ HEAP[sbox | s9] ^ HEAP[x2_sbox | sE] ^ HEAP[x3_sbox | s3] ^ R56;
            t7 = HEAP[x3_sbox | s4] ^ HEAP[sbox | s9] ^ HEAP[sbox | sE] ^ HEAP[x2_sbox | s3] ^ R57;
            t8 = HEAP[x2_sbox | s8] ^ HEAP[x3_sbox | sD] ^ HEAP[sbox | s2] ^ HEAP[sbox | s7] ^ R58;
            t9 = HEAP[sbox | s8] ^ HEAP[x2_sbox | sD] ^ HEAP[x3_sbox | s2] ^ HEAP[sbox | s7] ^ R59;
            tA = HEAP[sbox | s8] ^ HEAP[sbox | sD] ^ HEAP[x2_sbox | s2] ^ HEAP[x3_sbox | s7] ^ R5A;
            tB = HEAP[x3_sbox | s8] ^ HEAP[sbox | sD] ^ HEAP[sbox | s2] ^ HEAP[x2_sbox | s7] ^ R5B;
            tC = HEAP[x2_sbox | sC] ^ HEAP[x3_sbox | s1] ^ HEAP[sbox | s6] ^ HEAP[sbox | sB] ^ R5C;
            tD = HEAP[sbox | sC] ^ HEAP[x2_sbox | s1] ^ HEAP[x3_sbox | s6] ^ HEAP[sbox | sB] ^ R5D;
            tE = HEAP[sbox | sC] ^ HEAP[sbox | s1] ^ HEAP[x2_sbox | s6] ^ HEAP[x3_sbox | sB] ^ R5E;
            tF = HEAP[x3_sbox | sC] ^ HEAP[sbox | s1] ^ HEAP[sbox | s6] ^ HEAP[x2_sbox | sB] ^ R5F;
            s0 = HEAP[x2_sbox | t0] ^ HEAP[x3_sbox | t5] ^ HEAP[sbox | tA] ^ HEAP[sbox | tF] ^ R60;
            s1 = HEAP[sbox | t0] ^ HEAP[x2_sbox | t5] ^ HEAP[x3_sbox | tA] ^ HEAP[sbox | tF] ^ R61;
            s2 = HEAP[sbox | t0] ^ HEAP[sbox | t5] ^ HEAP[x2_sbox | tA] ^ HEAP[x3_sbox | tF] ^ R62;
            s3 = HEAP[x3_sbox | t0] ^ HEAP[sbox | t5] ^ HEAP[sbox | tA] ^ HEAP[x2_sbox | tF] ^ R63;
            s4 = HEAP[x2_sbox | t4] ^ HEAP[x3_sbox | t9] ^ HEAP[sbox | tE] ^ HEAP[sbox | t3] ^ R64;
            s5 = HEAP[sbox | t4] ^ HEAP[x2_sbox | t9] ^ HEAP[x3_sbox | tE] ^ HEAP[sbox | t3] ^ R65;
            s6 = HEAP[sbox | t4] ^ HEAP[sbox | t9] ^ HEAP[x2_sbox | tE] ^ HEAP[x3_sbox | t3] ^ R66;
            s7 = HEAP[x3_sbox | t4] ^ HEAP[sbox | t9] ^ HEAP[sbox | tE] ^ HEAP[x2_sbox | t3] ^ R67;
            s8 = HEAP[x2_sbox | t8] ^ HEAP[x3_sbox | tD] ^ HEAP[sbox | t2] ^ HEAP[sbox | t7] ^ R68;
            s9 = HEAP[sbox | t8] ^ HEAP[x2_sbox | tD] ^ HEAP[x3_sbox | t2] ^ HEAP[sbox | t7] ^ R69;
            sA = HEAP[sbox | t8] ^ HEAP[sbox | tD] ^ HEAP[x2_sbox | t2] ^ HEAP[x3_sbox | t7] ^ R6A;
            sB = HEAP[x3_sbox | t8] ^ HEAP[sbox | tD] ^ HEAP[sbox | t2] ^ HEAP[x2_sbox | t7] ^ R6B;
            sC = HEAP[x2_sbox | tC] ^ HEAP[x3_sbox | t1] ^ HEAP[sbox | t6] ^ HEAP[sbox | tB] ^ R6C;
            sD = HEAP[sbox | tC] ^ HEAP[x2_sbox | t1] ^ HEAP[x3_sbox | t6] ^ HEAP[sbox | tB] ^ R6D;
            sE = HEAP[sbox | tC] ^ HEAP[sbox | t1] ^ HEAP[x2_sbox | t6] ^ HEAP[x3_sbox | tB] ^ R6E;
            sF = HEAP[x3_sbox | tC] ^ HEAP[sbox | t1] ^ HEAP[sbox | t6] ^ HEAP[x2_sbox | tB] ^ R6F;
            t0 = HEAP[x2_sbox | s0] ^ HEAP[x3_sbox | s5] ^ HEAP[sbox | sA] ^ HEAP[sbox | sF] ^ R70;
            t1 = HEAP[sbox | s0] ^ HEAP[x2_sbox | s5] ^ HEAP[x3_sbox | sA] ^ HEAP[sbox | sF] ^ R71;
            t2 = HEAP[sbox | s0] ^ HEAP[sbox | s5] ^ HEAP[x2_sbox | sA] ^ HEAP[x3_sbox | sF] ^ R72;
            t3 = HEAP[x3_sbox | s0] ^ HEAP[sbox | s5] ^ HEAP[sbox | sA] ^ HEAP[x2_sbox | sF] ^ R73;
            t4 = HEAP[x2_sbox | s4] ^ HEAP[x3_sbox | s9] ^ HEAP[sbox | sE] ^ HEAP[sbox | s3] ^ R74;
            t5 = HEAP[sbox | s4] ^ HEAP[x2_sbox | s9] ^ HEAP[x3_sbox | sE] ^ HEAP[sbox | s3] ^ R75;
            t6 = HEAP[sbox | s4] ^ HEAP[sbox | s9] ^ HEAP[x2_sbox | sE] ^ HEAP[x3_sbox | s3] ^ R76;
            t7 = HEAP[x3_sbox | s4] ^ HEAP[sbox | s9] ^ HEAP[sbox | sE] ^ HEAP[x2_sbox | s3] ^ R77;
            t8 = HEAP[x2_sbox | s8] ^ HEAP[x3_sbox | sD] ^ HEAP[sbox | s2] ^ HEAP[sbox | s7] ^ R78;
            t9 = HEAP[sbox | s8] ^ HEAP[x2_sbox | sD] ^ HEAP[x3_sbox | s2] ^ HEAP[sbox | s7] ^ R79;
            tA = HEAP[sbox | s8] ^ HEAP[sbox | sD] ^ HEAP[x2_sbox | s2] ^ HEAP[x3_sbox | s7] ^ R7A;
            tB = HEAP[x3_sbox | s8] ^ HEAP[sbox | sD] ^ HEAP[sbox | s2] ^ HEAP[x2_sbox | s7] ^ R7B;
            tC = HEAP[x2_sbox | sC] ^ HEAP[x3_sbox | s1] ^ HEAP[sbox | s6] ^ HEAP[sbox | sB] ^ R7C;
            tD = HEAP[sbox | sC] ^ HEAP[x2_sbox | s1] ^ HEAP[x3_sbox | s6] ^ HEAP[sbox | sB] ^ R7D;
            tE = HEAP[sbox | sC] ^ HEAP[sbox | s1] ^ HEAP[x2_sbox | s6] ^ HEAP[x3_sbox | sB] ^ R7E;
            tF = HEAP[x3_sbox | sC] ^ HEAP[sbox | s1] ^ HEAP[sbox | s6] ^ HEAP[x2_sbox | sB] ^ R7F;
            s0 = HEAP[x2_sbox | t0] ^ HEAP[x3_sbox | t5] ^ HEAP[sbox | tA] ^ HEAP[sbox | tF] ^ R80;
            s1 = HEAP[sbox | t0] ^ HEAP[x2_sbox | t5] ^ HEAP[x3_sbox | tA] ^ HEAP[sbox | tF] ^ R81;
            s2 = HEAP[sbox | t0] ^ HEAP[sbox | t5] ^ HEAP[x2_sbox | tA] ^ HEAP[x3_sbox | tF] ^ R82;
            s3 = HEAP[x3_sbox | t0] ^ HEAP[sbox | t5] ^ HEAP[sbox | tA] ^ HEAP[x2_sbox | tF] ^ R83;
            s4 = HEAP[x2_sbox | t4] ^ HEAP[x3_sbox | t9] ^ HEAP[sbox | tE] ^ HEAP[sbox | t3] ^ R84;
            s5 = HEAP[sbox | t4] ^ HEAP[x2_sbox | t9] ^ HEAP[x3_sbox | tE] ^ HEAP[sbox | t3] ^ R85;
            s6 = HEAP[sbox | t4] ^ HEAP[sbox | t9] ^ HEAP[x2_sbox | tE] ^ HEAP[x3_sbox | t3] ^ R86;
            s7 = HEAP[x3_sbox | t4] ^ HEAP[sbox | t9] ^ HEAP[sbox | tE] ^ HEAP[x2_sbox | t3] ^ R87;
            s8 = HEAP[x2_sbox | t8] ^ HEAP[x3_sbox | tD] ^ HEAP[sbox | t2] ^ HEAP[sbox | t7] ^ R88;
            s9 = HEAP[sbox | t8] ^ HEAP[x2_sbox | tD] ^ HEAP[x3_sbox | t2] ^ HEAP[sbox | t7] ^ R89;
            sA = HEAP[sbox | t8] ^ HEAP[sbox | tD] ^ HEAP[x2_sbox | t2] ^ HEAP[x3_sbox | t7] ^ R8A;
            sB = HEAP[x3_sbox | t8] ^ HEAP[sbox | tD] ^ HEAP[sbox | t2] ^ HEAP[x2_sbox | t7] ^ R8B;
            sC = HEAP[x2_sbox | tC] ^ HEAP[x3_sbox | t1] ^ HEAP[sbox | t6] ^ HEAP[sbox | tB] ^ R8C;
            sD = HEAP[sbox | tC] ^ HEAP[x2_sbox | t1] ^ HEAP[x3_sbox | t6] ^ HEAP[sbox | tB] ^ R8D;
            sE = HEAP[sbox | tC] ^ HEAP[sbox | t1] ^ HEAP[x2_sbox | t6] ^ HEAP[x3_sbox | tB] ^ R8E;
            sF = HEAP[x3_sbox | tC] ^ HEAP[sbox | t1] ^ HEAP[sbox | t6] ^ HEAP[x2_sbox | tB] ^ R8F;
            t0 = HEAP[x2_sbox | s0] ^ HEAP[x3_sbox | s5] ^ HEAP[sbox | sA] ^ HEAP[sbox | sF] ^ R90;
            t1 = HEAP[sbox | s0] ^ HEAP[x2_sbox | s5] ^ HEAP[x3_sbox | sA] ^ HEAP[sbox | sF] ^ R91;
            t2 = HEAP[sbox | s0] ^ HEAP[sbox | s5] ^ HEAP[x2_sbox | sA] ^ HEAP[x3_sbox | sF] ^ R92;
            t3 = HEAP[x3_sbox | s0] ^ HEAP[sbox | s5] ^ HEAP[sbox | sA] ^ HEAP[x2_sbox | sF] ^ R93;
            t4 = HEAP[x2_sbox | s4] ^ HEAP[x3_sbox | s9] ^ HEAP[sbox | sE] ^ HEAP[sbox | s3] ^ R94;
            t5 = HEAP[sbox | s4] ^ HEAP[x2_sbox | s9] ^ HEAP[x3_sbox | sE] ^ HEAP[sbox | s3] ^ R95;
            t6 = HEAP[sbox | s4] ^ HEAP[sbox | s9] ^ HEAP[x2_sbox | sE] ^ HEAP[x3_sbox | s3] ^ R96;
            t7 = HEAP[x3_sbox | s4] ^ HEAP[sbox | s9] ^ HEAP[sbox | sE] ^ HEAP[x2_sbox | s3] ^ R97;
            t8 = HEAP[x2_sbox | s8] ^ HEAP[x3_sbox | sD] ^ HEAP[sbox | s2] ^ HEAP[sbox | s7] ^ R98;
            t9 = HEAP[sbox | s8] ^ HEAP[x2_sbox | sD] ^ HEAP[x3_sbox | s2] ^ HEAP[sbox | s7] ^ R99;
            tA = HEAP[sbox | s8] ^ HEAP[sbox | sD] ^ HEAP[x2_sbox | s2] ^ HEAP[x3_sbox | s7] ^ R9A;
            tB = HEAP[x3_sbox | s8] ^ HEAP[sbox | sD] ^ HEAP[sbox | s2] ^ HEAP[x2_sbox | s7] ^ R9B;
            tC = HEAP[x2_sbox | sC] ^ HEAP[x3_sbox | s1] ^ HEAP[sbox | s6] ^ HEAP[sbox | sB] ^ R9C;
            tD = HEAP[sbox | sC] ^ HEAP[x2_sbox | s1] ^ HEAP[x3_sbox | s6] ^ HEAP[sbox | sB] ^ R9D;
            tE = HEAP[sbox | sC] ^ HEAP[sbox | s1] ^ HEAP[x2_sbox | s6] ^ HEAP[x3_sbox | sB] ^ R9E;
            tF = HEAP[x3_sbox | sC] ^ HEAP[sbox | s1] ^ HEAP[sbox | s6] ^ HEAP[x2_sbox | sB] ^ R9F;
            S0 = HEAP[sbox | t0] ^ RA0;
            S1 = HEAP[sbox | t5] ^ RA1;
            S2 = HEAP[sbox | tA] ^ RA2;
            S3 = HEAP[sbox | tF] ^ RA3;
            S4 = HEAP[sbox | t4] ^ RA4;
            S5 = HEAP[sbox | t9] ^ RA5;
            S6 = HEAP[sbox | tE] ^ RA6;
            S7 = HEAP[sbox | t3] ^ RA7;
            S8 = HEAP[sbox | t8] ^ RA8;
            S9 = HEAP[sbox | tD] ^ RA9;
            SA = HEAP[sbox | t2] ^ RAA;
            SB = HEAP[sbox | t7] ^ RAB;
            SC = HEAP[sbox | tC] ^ RAC;
            SD = HEAP[sbox | t1] ^ RAD;
            SE = HEAP[sbox | t6] ^ RAE;
            SF = HEAP[sbox | tB] ^ RAF;
        }
        function _decrypt_128(s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, sA, sB, sC, sD, sE, sF) {
            s0 = s0 | 0;
            s1 = s1 | 0;
            s2 = s2 | 0;
            s3 = s3 | 0;
            s4 = s4 | 0;
            s5 = s5 | 0;
            s6 = s6 | 0;
            s7 = s7 | 0;
            s8 = s8 | 0;
            s9 = s9 | 0;
            sA = sA | 0;
            sB = sB | 0;
            sC = sC | 0;
            sD = sD | 0;
            sE = sE | 0;
            sF = sF | 0;
            var t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0, tA = 0, tB = 0, tC = 0, tD = 0, tE = 0, tF = 0, inv_sbox = 256, x9 = 1024, xB = 1280, xD = 1536, xE = 1792;
            t0 = HEAP[inv_sbox | s0 ^ RA0] ^ R90;
            t1 = HEAP[inv_sbox | sD ^ RAD] ^ R91;
            t2 = HEAP[inv_sbox | sA ^ RAA] ^ R92;
            t3 = HEAP[inv_sbox | s7 ^ RA7] ^ R93;
            t4 = HEAP[inv_sbox | s4 ^ RA4] ^ R94;
            t5 = HEAP[inv_sbox | s1 ^ RA1] ^ R95;
            t6 = HEAP[inv_sbox | sE ^ RAE] ^ R96;
            t7 = HEAP[inv_sbox | sB ^ RAB] ^ R97;
            t8 = HEAP[inv_sbox | s8 ^ RA8] ^ R98;
            t9 = HEAP[inv_sbox | s5 ^ RA5] ^ R99;
            tA = HEAP[inv_sbox | s2 ^ RA2] ^ R9A;
            tB = HEAP[inv_sbox | sF ^ RAF] ^ R9B;
            tC = HEAP[inv_sbox | sC ^ RAC] ^ R9C;
            tD = HEAP[inv_sbox | s9 ^ RA9] ^ R9D;
            tE = HEAP[inv_sbox | s6 ^ RA6] ^ R9E;
            tF = HEAP[inv_sbox | s3 ^ RA3] ^ R9F;
            s0 = HEAP[xE | t0] ^ HEAP[xB | t1] ^ HEAP[xD | t2] ^ HEAP[x9 | t3];
            s1 = HEAP[x9 | tC] ^ HEAP[xE | tD] ^ HEAP[xB | tE] ^ HEAP[xD | tF];
            s2 = HEAP[xD | t8] ^ HEAP[x9 | t9] ^ HEAP[xE | tA] ^ HEAP[xB | tB];
            s3 = HEAP[xB | t4] ^ HEAP[xD | t5] ^ HEAP[x9 | t6] ^ HEAP[xE | t7];
            s4 = HEAP[xE | t4] ^ HEAP[xB | t5] ^ HEAP[xD | t6] ^ HEAP[x9 | t7];
            s5 = HEAP[x9 | t0] ^ HEAP[xE | t1] ^ HEAP[xB | t2] ^ HEAP[xD | t3];
            s6 = HEAP[xD | tC] ^ HEAP[x9 | tD] ^ HEAP[xE | tE] ^ HEAP[xB | tF];
            s7 = HEAP[xB | t8] ^ HEAP[xD | t9] ^ HEAP[x9 | tA] ^ HEAP[xE | tB];
            s8 = HEAP[xE | t8] ^ HEAP[xB | t9] ^ HEAP[xD | tA] ^ HEAP[x9 | tB];
            s9 = HEAP[x9 | t4] ^ HEAP[xE | t5] ^ HEAP[xB | t6] ^ HEAP[xD | t7];
            sA = HEAP[xD | t0] ^ HEAP[x9 | t1] ^ HEAP[xE | t2] ^ HEAP[xB | t3];
            sB = HEAP[xB | tC] ^ HEAP[xD | tD] ^ HEAP[x9 | tE] ^ HEAP[xE | tF];
            sC = HEAP[xE | tC] ^ HEAP[xB | tD] ^ HEAP[xD | tE] ^ HEAP[x9 | tF];
            sD = HEAP[x9 | t8] ^ HEAP[xE | t9] ^ HEAP[xB | tA] ^ HEAP[xD | tB];
            sE = HEAP[xD | t4] ^ HEAP[x9 | t5] ^ HEAP[xE | t6] ^ HEAP[xB | t7];
            sF = HEAP[xB | t0] ^ HEAP[xD | t1] ^ HEAP[x9 | t2] ^ HEAP[xE | t3];
            t0 = HEAP[inv_sbox | s0] ^ R80;
            t1 = HEAP[inv_sbox | s1] ^ R81;
            t2 = HEAP[inv_sbox | s2] ^ R82;
            t3 = HEAP[inv_sbox | s3] ^ R83;
            t4 = HEAP[inv_sbox | s4] ^ R84;
            t5 = HEAP[inv_sbox | s5] ^ R85;
            t6 = HEAP[inv_sbox | s6] ^ R86;
            t7 = HEAP[inv_sbox | s7] ^ R87;
            t8 = HEAP[inv_sbox | s8] ^ R88;
            t9 = HEAP[inv_sbox | s9] ^ R89;
            tA = HEAP[inv_sbox | sA] ^ R8A;
            tB = HEAP[inv_sbox | sB] ^ R8B;
            tC = HEAP[inv_sbox | sC] ^ R8C;
            tD = HEAP[inv_sbox | sD] ^ R8D;
            tE = HEAP[inv_sbox | sE] ^ R8E;
            tF = HEAP[inv_sbox | sF] ^ R8F;
            s0 = HEAP[xE | t0] ^ HEAP[xB | t1] ^ HEAP[xD | t2] ^ HEAP[x9 | t3];
            s1 = HEAP[x9 | tC] ^ HEAP[xE | tD] ^ HEAP[xB | tE] ^ HEAP[xD | tF];
            s2 = HEAP[xD | t8] ^ HEAP[x9 | t9] ^ HEAP[xE | tA] ^ HEAP[xB | tB];
            s3 = HEAP[xB | t4] ^ HEAP[xD | t5] ^ HEAP[x9 | t6] ^ HEAP[xE | t7];
            s4 = HEAP[xE | t4] ^ HEAP[xB | t5] ^ HEAP[xD | t6] ^ HEAP[x9 | t7];
            s5 = HEAP[x9 | t0] ^ HEAP[xE | t1] ^ HEAP[xB | t2] ^ HEAP[xD | t3];
            s6 = HEAP[xD | tC] ^ HEAP[x9 | tD] ^ HEAP[xE | tE] ^ HEAP[xB | tF];
            s7 = HEAP[xB | t8] ^ HEAP[xD | t9] ^ HEAP[x9 | tA] ^ HEAP[xE | tB];
            s8 = HEAP[xE | t8] ^ HEAP[xB | t9] ^ HEAP[xD | tA] ^ HEAP[x9 | tB];
            s9 = HEAP[x9 | t4] ^ HEAP[xE | t5] ^ HEAP[xB | t6] ^ HEAP[xD | t7];
            sA = HEAP[xD | t0] ^ HEAP[x9 | t1] ^ HEAP[xE | t2] ^ HEAP[xB | t3];
            sB = HEAP[xB | tC] ^ HEAP[xD | tD] ^ HEAP[x9 | tE] ^ HEAP[xE | tF];
            sC = HEAP[xE | tC] ^ HEAP[xB | tD] ^ HEAP[xD | tE] ^ HEAP[x9 | tF];
            sD = HEAP[x9 | t8] ^ HEAP[xE | t9] ^ HEAP[xB | tA] ^ HEAP[xD | tB];
            sE = HEAP[xD | t4] ^ HEAP[x9 | t5] ^ HEAP[xE | t6] ^ HEAP[xB | t7];
            sF = HEAP[xB | t0] ^ HEAP[xD | t1] ^ HEAP[x9 | t2] ^ HEAP[xE | t3];
            t0 = HEAP[inv_sbox | s0] ^ R70;
            t1 = HEAP[inv_sbox | s1] ^ R71;
            t2 = HEAP[inv_sbox | s2] ^ R72;
            t3 = HEAP[inv_sbox | s3] ^ R73;
            t4 = HEAP[inv_sbox | s4] ^ R74;
            t5 = HEAP[inv_sbox | s5] ^ R75;
            t6 = HEAP[inv_sbox | s6] ^ R76;
            t7 = HEAP[inv_sbox | s7] ^ R77;
            t8 = HEAP[inv_sbox | s8] ^ R78;
            t9 = HEAP[inv_sbox | s9] ^ R79;
            tA = HEAP[inv_sbox | sA] ^ R7A;
            tB = HEAP[inv_sbox | sB] ^ R7B;
            tC = HEAP[inv_sbox | sC] ^ R7C;
            tD = HEAP[inv_sbox | sD] ^ R7D;
            tE = HEAP[inv_sbox | sE] ^ R7E;
            tF = HEAP[inv_sbox | sF] ^ R7F;
            s0 = HEAP[xE | t0] ^ HEAP[xB | t1] ^ HEAP[xD | t2] ^ HEAP[x9 | t3];
            s1 = HEAP[x9 | tC] ^ HEAP[xE | tD] ^ HEAP[xB | tE] ^ HEAP[xD | tF];
            s2 = HEAP[xD | t8] ^ HEAP[x9 | t9] ^ HEAP[xE | tA] ^ HEAP[xB | tB];
            s3 = HEAP[xB | t4] ^ HEAP[xD | t5] ^ HEAP[x9 | t6] ^ HEAP[xE | t7];
            s4 = HEAP[xE | t4] ^ HEAP[xB | t5] ^ HEAP[xD | t6] ^ HEAP[x9 | t7];
            s5 = HEAP[x9 | t0] ^ HEAP[xE | t1] ^ HEAP[xB | t2] ^ HEAP[xD | t3];
            s6 = HEAP[xD | tC] ^ HEAP[x9 | tD] ^ HEAP[xE | tE] ^ HEAP[xB | tF];
            s7 = HEAP[xB | t8] ^ HEAP[xD | t9] ^ HEAP[x9 | tA] ^ HEAP[xE | tB];
            s8 = HEAP[xE | t8] ^ HEAP[xB | t9] ^ HEAP[xD | tA] ^ HEAP[x9 | tB];
            s9 = HEAP[x9 | t4] ^ HEAP[xE | t5] ^ HEAP[xB | t6] ^ HEAP[xD | t7];
            sA = HEAP[xD | t0] ^ HEAP[x9 | t1] ^ HEAP[xE | t2] ^ HEAP[xB | t3];
            sB = HEAP[xB | tC] ^ HEAP[xD | tD] ^ HEAP[x9 | tE] ^ HEAP[xE | tF];
            sC = HEAP[xE | tC] ^ HEAP[xB | tD] ^ HEAP[xD | tE] ^ HEAP[x9 | tF];
            sD = HEAP[x9 | t8] ^ HEAP[xE | t9] ^ HEAP[xB | tA] ^ HEAP[xD | tB];
            sE = HEAP[xD | t4] ^ HEAP[x9 | t5] ^ HEAP[xE | t6] ^ HEAP[xB | t7];
            sF = HEAP[xB | t0] ^ HEAP[xD | t1] ^ HEAP[x9 | t2] ^ HEAP[xE | t3];
            t0 = HEAP[inv_sbox | s0] ^ R60;
            t1 = HEAP[inv_sbox | s1] ^ R61;
            t2 = HEAP[inv_sbox | s2] ^ R62;
            t3 = HEAP[inv_sbox | s3] ^ R63;
            t4 = HEAP[inv_sbox | s4] ^ R64;
            t5 = HEAP[inv_sbox | s5] ^ R65;
            t6 = HEAP[inv_sbox | s6] ^ R66;
            t7 = HEAP[inv_sbox | s7] ^ R67;
            t8 = HEAP[inv_sbox | s8] ^ R68;
            t9 = HEAP[inv_sbox | s9] ^ R69;
            tA = HEAP[inv_sbox | sA] ^ R6A;
            tB = HEAP[inv_sbox | sB] ^ R6B;
            tC = HEAP[inv_sbox | sC] ^ R6C;
            tD = HEAP[inv_sbox | sD] ^ R6D;
            tE = HEAP[inv_sbox | sE] ^ R6E;
            tF = HEAP[inv_sbox | sF] ^ R6F;
            s0 = HEAP[xE | t0] ^ HEAP[xB | t1] ^ HEAP[xD | t2] ^ HEAP[x9 | t3];
            s1 = HEAP[x9 | tC] ^ HEAP[xE | tD] ^ HEAP[xB | tE] ^ HEAP[xD | tF];
            s2 = HEAP[xD | t8] ^ HEAP[x9 | t9] ^ HEAP[xE | tA] ^ HEAP[xB | tB];
            s3 = HEAP[xB | t4] ^ HEAP[xD | t5] ^ HEAP[x9 | t6] ^ HEAP[xE | t7];
            s4 = HEAP[xE | t4] ^ HEAP[xB | t5] ^ HEAP[xD | t6] ^ HEAP[x9 | t7];
            s5 = HEAP[x9 | t0] ^ HEAP[xE | t1] ^ HEAP[xB | t2] ^ HEAP[xD | t3];
            s6 = HEAP[xD | tC] ^ HEAP[x9 | tD] ^ HEAP[xE | tE] ^ HEAP[xB | tF];
            s7 = HEAP[xB | t8] ^ HEAP[xD | t9] ^ HEAP[x9 | tA] ^ HEAP[xE | tB];
            s8 = HEAP[xE | t8] ^ HEAP[xB | t9] ^ HEAP[xD | tA] ^ HEAP[x9 | tB];
            s9 = HEAP[x9 | t4] ^ HEAP[xE | t5] ^ HEAP[xB | t6] ^ HEAP[xD | t7];
            sA = HEAP[xD | t0] ^ HEAP[x9 | t1] ^ HEAP[xE | t2] ^ HEAP[xB | t3];
            sB = HEAP[xB | tC] ^ HEAP[xD | tD] ^ HEAP[x9 | tE] ^ HEAP[xE | tF];
            sC = HEAP[xE | tC] ^ HEAP[xB | tD] ^ HEAP[xD | tE] ^ HEAP[x9 | tF];
            sD = HEAP[x9 | t8] ^ HEAP[xE | t9] ^ HEAP[xB | tA] ^ HEAP[xD | tB];
            sE = HEAP[xD | t4] ^ HEAP[x9 | t5] ^ HEAP[xE | t6] ^ HEAP[xB | t7];
            sF = HEAP[xB | t0] ^ HEAP[xD | t1] ^ HEAP[x9 | t2] ^ HEAP[xE | t3];
            t0 = HEAP[inv_sbox | s0] ^ R50;
            t1 = HEAP[inv_sbox | s1] ^ R51;
            t2 = HEAP[inv_sbox | s2] ^ R52;
            t3 = HEAP[inv_sbox | s3] ^ R53;
            t4 = HEAP[inv_sbox | s4] ^ R54;
            t5 = HEAP[inv_sbox | s5] ^ R55;
            t6 = HEAP[inv_sbox | s6] ^ R56;
            t7 = HEAP[inv_sbox | s7] ^ R57;
            t8 = HEAP[inv_sbox | s8] ^ R58;
            t9 = HEAP[inv_sbox | s9] ^ R59;
            tA = HEAP[inv_sbox | sA] ^ R5A;
            tB = HEAP[inv_sbox | sB] ^ R5B;
            tC = HEAP[inv_sbox | sC] ^ R5C;
            tD = HEAP[inv_sbox | sD] ^ R5D;
            tE = HEAP[inv_sbox | sE] ^ R5E;
            tF = HEAP[inv_sbox | sF] ^ R5F;
            s0 = HEAP[xE | t0] ^ HEAP[xB | t1] ^ HEAP[xD | t2] ^ HEAP[x9 | t3];
            s1 = HEAP[x9 | tC] ^ HEAP[xE | tD] ^ HEAP[xB | tE] ^ HEAP[xD | tF];
            s2 = HEAP[xD | t8] ^ HEAP[x9 | t9] ^ HEAP[xE | tA] ^ HEAP[xB | tB];
            s3 = HEAP[xB | t4] ^ HEAP[xD | t5] ^ HEAP[x9 | t6] ^ HEAP[xE | t7];
            s4 = HEAP[xE | t4] ^ HEAP[xB | t5] ^ HEAP[xD | t6] ^ HEAP[x9 | t7];
            s5 = HEAP[x9 | t0] ^ HEAP[xE | t1] ^ HEAP[xB | t2] ^ HEAP[xD | t3];
            s6 = HEAP[xD | tC] ^ HEAP[x9 | tD] ^ HEAP[xE | tE] ^ HEAP[xB | tF];
            s7 = HEAP[xB | t8] ^ HEAP[xD | t9] ^ HEAP[x9 | tA] ^ HEAP[xE | tB];
            s8 = HEAP[xE | t8] ^ HEAP[xB | t9] ^ HEAP[xD | tA] ^ HEAP[x9 | tB];
            s9 = HEAP[x9 | t4] ^ HEAP[xE | t5] ^ HEAP[xB | t6] ^ HEAP[xD | t7];
            sA = HEAP[xD | t0] ^ HEAP[x9 | t1] ^ HEAP[xE | t2] ^ HEAP[xB | t3];
            sB = HEAP[xB | tC] ^ HEAP[xD | tD] ^ HEAP[x9 | tE] ^ HEAP[xE | tF];
            sC = HEAP[xE | tC] ^ HEAP[xB | tD] ^ HEAP[xD | tE] ^ HEAP[x9 | tF];
            sD = HEAP[x9 | t8] ^ HEAP[xE | t9] ^ HEAP[xB | tA] ^ HEAP[xD | tB];
            sE = HEAP[xD | t4] ^ HEAP[x9 | t5] ^ HEAP[xE | t6] ^ HEAP[xB | t7];
            sF = HEAP[xB | t0] ^ HEAP[xD | t1] ^ HEAP[x9 | t2] ^ HEAP[xE | t3];
            t0 = HEAP[inv_sbox | s0] ^ R40;
            t1 = HEAP[inv_sbox | s1] ^ R41;
            t2 = HEAP[inv_sbox | s2] ^ R42;
            t3 = HEAP[inv_sbox | s3] ^ R43;
            t4 = HEAP[inv_sbox | s4] ^ R44;
            t5 = HEAP[inv_sbox | s5] ^ R45;
            t6 = HEAP[inv_sbox | s6] ^ R46;
            t7 = HEAP[inv_sbox | s7] ^ R47;
            t8 = HEAP[inv_sbox | s8] ^ R48;
            t9 = HEAP[inv_sbox | s9] ^ R49;
            tA = HEAP[inv_sbox | sA] ^ R4A;
            tB = HEAP[inv_sbox | sB] ^ R4B;
            tC = HEAP[inv_sbox | sC] ^ R4C;
            tD = HEAP[inv_sbox | sD] ^ R4D;
            tE = HEAP[inv_sbox | sE] ^ R4E;
            tF = HEAP[inv_sbox | sF] ^ R4F;
            s0 = HEAP[xE | t0] ^ HEAP[xB | t1] ^ HEAP[xD | t2] ^ HEAP[x9 | t3];
            s1 = HEAP[x9 | tC] ^ HEAP[xE | tD] ^ HEAP[xB | tE] ^ HEAP[xD | tF];
            s2 = HEAP[xD | t8] ^ HEAP[x9 | t9] ^ HEAP[xE | tA] ^ HEAP[xB | tB];
            s3 = HEAP[xB | t4] ^ HEAP[xD | t5] ^ HEAP[x9 | t6] ^ HEAP[xE | t7];
            s4 = HEAP[xE | t4] ^ HEAP[xB | t5] ^ HEAP[xD | t6] ^ HEAP[x9 | t7];
            s5 = HEAP[x9 | t0] ^ HEAP[xE | t1] ^ HEAP[xB | t2] ^ HEAP[xD | t3];
            s6 = HEAP[xD | tC] ^ HEAP[x9 | tD] ^ HEAP[xE | tE] ^ HEAP[xB | tF];
            s7 = HEAP[xB | t8] ^ HEAP[xD | t9] ^ HEAP[x9 | tA] ^ HEAP[xE | tB];
            s8 = HEAP[xE | t8] ^ HEAP[xB | t9] ^ HEAP[xD | tA] ^ HEAP[x9 | tB];
            s9 = HEAP[x9 | t4] ^ HEAP[xE | t5] ^ HEAP[xB | t6] ^ HEAP[xD | t7];
            sA = HEAP[xD | t0] ^ HEAP[x9 | t1] ^ HEAP[xE | t2] ^ HEAP[xB | t3];
            sB = HEAP[xB | tC] ^ HEAP[xD | tD] ^ HEAP[x9 | tE] ^ HEAP[xE | tF];
            sC = HEAP[xE | tC] ^ HEAP[xB | tD] ^ HEAP[xD | tE] ^ HEAP[x9 | tF];
            sD = HEAP[x9 | t8] ^ HEAP[xE | t9] ^ HEAP[xB | tA] ^ HEAP[xD | tB];
            sE = HEAP[xD | t4] ^ HEAP[x9 | t5] ^ HEAP[xE | t6] ^ HEAP[xB | t7];
            sF = HEAP[xB | t0] ^ HEAP[xD | t1] ^ HEAP[x9 | t2] ^ HEAP[xE | t3];
            t0 = HEAP[inv_sbox | s0] ^ R30;
            t1 = HEAP[inv_sbox | s1] ^ R31;
            t2 = HEAP[inv_sbox | s2] ^ R32;
            t3 = HEAP[inv_sbox | s3] ^ R33;
            t4 = HEAP[inv_sbox | s4] ^ R34;
            t5 = HEAP[inv_sbox | s5] ^ R35;
            t6 = HEAP[inv_sbox | s6] ^ R36;
            t7 = HEAP[inv_sbox | s7] ^ R37;
            t8 = HEAP[inv_sbox | s8] ^ R38;
            t9 = HEAP[inv_sbox | s9] ^ R39;
            tA = HEAP[inv_sbox | sA] ^ R3A;
            tB = HEAP[inv_sbox | sB] ^ R3B;
            tC = HEAP[inv_sbox | sC] ^ R3C;
            tD = HEAP[inv_sbox | sD] ^ R3D;
            tE = HEAP[inv_sbox | sE] ^ R3E;
            tF = HEAP[inv_sbox | sF] ^ R3F;
            s0 = HEAP[xE | t0] ^ HEAP[xB | t1] ^ HEAP[xD | t2] ^ HEAP[x9 | t3];
            s1 = HEAP[x9 | tC] ^ HEAP[xE | tD] ^ HEAP[xB | tE] ^ HEAP[xD | tF];
            s2 = HEAP[xD | t8] ^ HEAP[x9 | t9] ^ HEAP[xE | tA] ^ HEAP[xB | tB];
            s3 = HEAP[xB | t4] ^ HEAP[xD | t5] ^ HEAP[x9 | t6] ^ HEAP[xE | t7];
            s4 = HEAP[xE | t4] ^ HEAP[xB | t5] ^ HEAP[xD | t6] ^ HEAP[x9 | t7];
            s5 = HEAP[x9 | t0] ^ HEAP[xE | t1] ^ HEAP[xB | t2] ^ HEAP[xD | t3];
            s6 = HEAP[xD | tC] ^ HEAP[x9 | tD] ^ HEAP[xE | tE] ^ HEAP[xB | tF];
            s7 = HEAP[xB | t8] ^ HEAP[xD | t9] ^ HEAP[x9 | tA] ^ HEAP[xE | tB];
            s8 = HEAP[xE | t8] ^ HEAP[xB | t9] ^ HEAP[xD | tA] ^ HEAP[x9 | tB];
            s9 = HEAP[x9 | t4] ^ HEAP[xE | t5] ^ HEAP[xB | t6] ^ HEAP[xD | t7];
            sA = HEAP[xD | t0] ^ HEAP[x9 | t1] ^ HEAP[xE | t2] ^ HEAP[xB | t3];
            sB = HEAP[xB | tC] ^ HEAP[xD | tD] ^ HEAP[x9 | tE] ^ HEAP[xE | tF];
            sC = HEAP[xE | tC] ^ HEAP[xB | tD] ^ HEAP[xD | tE] ^ HEAP[x9 | tF];
            sD = HEAP[x9 | t8] ^ HEAP[xE | t9] ^ HEAP[xB | tA] ^ HEAP[xD | tB];
            sE = HEAP[xD | t4] ^ HEAP[x9 | t5] ^ HEAP[xE | t6] ^ HEAP[xB | t7];
            sF = HEAP[xB | t0] ^ HEAP[xD | t1] ^ HEAP[x9 | t2] ^ HEAP[xE | t3];
            t0 = HEAP[inv_sbox | s0] ^ R20;
            t1 = HEAP[inv_sbox | s1] ^ R21;
            t2 = HEAP[inv_sbox | s2] ^ R22;
            t3 = HEAP[inv_sbox | s3] ^ R23;
            t4 = HEAP[inv_sbox | s4] ^ R24;
            t5 = HEAP[inv_sbox | s5] ^ R25;
            t6 = HEAP[inv_sbox | s6] ^ R26;
            t7 = HEAP[inv_sbox | s7] ^ R27;
            t8 = HEAP[inv_sbox | s8] ^ R28;
            t9 = HEAP[inv_sbox | s9] ^ R29;
            tA = HEAP[inv_sbox | sA] ^ R2A;
            tB = HEAP[inv_sbox | sB] ^ R2B;
            tC = HEAP[inv_sbox | sC] ^ R2C;
            tD = HEAP[inv_sbox | sD] ^ R2D;
            tE = HEAP[inv_sbox | sE] ^ R2E;
            tF = HEAP[inv_sbox | sF] ^ R2F;
            s0 = HEAP[xE | t0] ^ HEAP[xB | t1] ^ HEAP[xD | t2] ^ HEAP[x9 | t3];
            s1 = HEAP[x9 | tC] ^ HEAP[xE | tD] ^ HEAP[xB | tE] ^ HEAP[xD | tF];
            s2 = HEAP[xD | t8] ^ HEAP[x9 | t9] ^ HEAP[xE | tA] ^ HEAP[xB | tB];
            s3 = HEAP[xB | t4] ^ HEAP[xD | t5] ^ HEAP[x9 | t6] ^ HEAP[xE | t7];
            s4 = HEAP[xE | t4] ^ HEAP[xB | t5] ^ HEAP[xD | t6] ^ HEAP[x9 | t7];
            s5 = HEAP[x9 | t0] ^ HEAP[xE | t1] ^ HEAP[xB | t2] ^ HEAP[xD | t3];
            s6 = HEAP[xD | tC] ^ HEAP[x9 | tD] ^ HEAP[xE | tE] ^ HEAP[xB | tF];
            s7 = HEAP[xB | t8] ^ HEAP[xD | t9] ^ HEAP[x9 | tA] ^ HEAP[xE | tB];
            s8 = HEAP[xE | t8] ^ HEAP[xB | t9] ^ HEAP[xD | tA] ^ HEAP[x9 | tB];
            s9 = HEAP[x9 | t4] ^ HEAP[xE | t5] ^ HEAP[xB | t6] ^ HEAP[xD | t7];
            sA = HEAP[xD | t0] ^ HEAP[x9 | t1] ^ HEAP[xE | t2] ^ HEAP[xB | t3];
            sB = HEAP[xB | tC] ^ HEAP[xD | tD] ^ HEAP[x9 | tE] ^ HEAP[xE | tF];
            sC = HEAP[xE | tC] ^ HEAP[xB | tD] ^ HEAP[xD | tE] ^ HEAP[x9 | tF];
            sD = HEAP[x9 | t8] ^ HEAP[xE | t9] ^ HEAP[xB | tA] ^ HEAP[xD | tB];
            sE = HEAP[xD | t4] ^ HEAP[x9 | t5] ^ HEAP[xE | t6] ^ HEAP[xB | t7];
            sF = HEAP[xB | t0] ^ HEAP[xD | t1] ^ HEAP[x9 | t2] ^ HEAP[xE | t3];
            t0 = HEAP[inv_sbox | s0] ^ R10;
            t1 = HEAP[inv_sbox | s1] ^ R11;
            t2 = HEAP[inv_sbox | s2] ^ R12;
            t3 = HEAP[inv_sbox | s3] ^ R13;
            t4 = HEAP[inv_sbox | s4] ^ R14;
            t5 = HEAP[inv_sbox | s5] ^ R15;
            t6 = HEAP[inv_sbox | s6] ^ R16;
            t7 = HEAP[inv_sbox | s7] ^ R17;
            t8 = HEAP[inv_sbox | s8] ^ R18;
            t9 = HEAP[inv_sbox | s9] ^ R19;
            tA = HEAP[inv_sbox | sA] ^ R1A;
            tB = HEAP[inv_sbox | sB] ^ R1B;
            tC = HEAP[inv_sbox | sC] ^ R1C;
            tD = HEAP[inv_sbox | sD] ^ R1D;
            tE = HEAP[inv_sbox | sE] ^ R1E;
            tF = HEAP[inv_sbox | sF] ^ R1F;
            s0 = HEAP[xE | t0] ^ HEAP[xB | t1] ^ HEAP[xD | t2] ^ HEAP[x9 | t3];
            s1 = HEAP[x9 | tC] ^ HEAP[xE | tD] ^ HEAP[xB | tE] ^ HEAP[xD | tF];
            s2 = HEAP[xD | t8] ^ HEAP[x9 | t9] ^ HEAP[xE | tA] ^ HEAP[xB | tB];
            s3 = HEAP[xB | t4] ^ HEAP[xD | t5] ^ HEAP[x9 | t6] ^ HEAP[xE | t7];
            s4 = HEAP[xE | t4] ^ HEAP[xB | t5] ^ HEAP[xD | t6] ^ HEAP[x9 | t7];
            s5 = HEAP[x9 | t0] ^ HEAP[xE | t1] ^ HEAP[xB | t2] ^ HEAP[xD | t3];
            s6 = HEAP[xD | tC] ^ HEAP[x9 | tD] ^ HEAP[xE | tE] ^ HEAP[xB | tF];
            s7 = HEAP[xB | t8] ^ HEAP[xD | t9] ^ HEAP[x9 | tA] ^ HEAP[xE | tB];
            s8 = HEAP[xE | t8] ^ HEAP[xB | t9] ^ HEAP[xD | tA] ^ HEAP[x9 | tB];
            s9 = HEAP[x9 | t4] ^ HEAP[xE | t5] ^ HEAP[xB | t6] ^ HEAP[xD | t7];
            sA = HEAP[xD | t0] ^ HEAP[x9 | t1] ^ HEAP[xE | t2] ^ HEAP[xB | t3];
            sB = HEAP[xB | tC] ^ HEAP[xD | tD] ^ HEAP[x9 | tE] ^ HEAP[xE | tF];
            sC = HEAP[xE | tC] ^ HEAP[xB | tD] ^ HEAP[xD | tE] ^ HEAP[x9 | tF];
            sD = HEAP[x9 | t8] ^ HEAP[xE | t9] ^ HEAP[xB | tA] ^ HEAP[xD | tB];
            sE = HEAP[xD | t4] ^ HEAP[x9 | t5] ^ HEAP[xE | t6] ^ HEAP[xB | t7];
            sF = HEAP[xB | t0] ^ HEAP[xD | t1] ^ HEAP[x9 | t2] ^ HEAP[xE | t3];
            S0 = HEAP[inv_sbox | s0] ^ R00;
            S1 = HEAP[inv_sbox | s1] ^ R01;
            S2 = HEAP[inv_sbox | s2] ^ R02;
            S3 = HEAP[inv_sbox | s3] ^ R03;
            S4 = HEAP[inv_sbox | s4] ^ R04;
            S5 = HEAP[inv_sbox | s5] ^ R05;
            S6 = HEAP[inv_sbox | s6] ^ R06;
            S7 = HEAP[inv_sbox | s7] ^ R07;
            S8 = HEAP[inv_sbox | s8] ^ R08;
            S9 = HEAP[inv_sbox | s9] ^ R09;
            SA = HEAP[inv_sbox | sA] ^ R0A;
            SB = HEAP[inv_sbox | sB] ^ R0B;
            SC = HEAP[inv_sbox | sC] ^ R0C;
            SD = HEAP[inv_sbox | sD] ^ R0D;
            SE = HEAP[inv_sbox | sE] ^ R0E;
            SF = HEAP[inv_sbox | sF] ^ R0F;
        }
        function init_state(s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, sA, sB, sC, sD, sE, sF) {
            s0 = s0 | 0;
            s1 = s1 | 0;
            s2 = s2 | 0;
            s3 = s3 | 0;
            s4 = s4 | 0;
            s5 = s5 | 0;
            s6 = s6 | 0;
            s7 = s7 | 0;
            s8 = s8 | 0;
            s9 = s9 | 0;
            sA = sA | 0;
            sB = sB | 0;
            sC = sC | 0;
            sD = sD | 0;
            sE = sE | 0;
            sF = sF | 0;
            S0 = s0;
            S1 = s1;
            S2 = s2;
            S3 = s3;
            S4 = s4;
            S5 = s5;
            S6 = s6;
            S7 = s7;
            S8 = s8;
            S9 = s9;
            SA = sA;
            SB = sB;
            SC = sC;
            SD = sD;
            SE = sE;
            SF = sF;
        }
        function save_state(offset) {
            offset = offset | 0;
            HEAP[offset] = S0;
            HEAP[offset | 1] = S1;
            HEAP[offset | 2] = S2;
            HEAP[offset | 3] = S3;
            HEAP[offset | 4] = S4;
            HEAP[offset | 5] = S5;
            HEAP[offset | 6] = S6;
            HEAP[offset | 7] = S7;
            HEAP[offset | 8] = S8;
            HEAP[offset | 9] = S9;
            HEAP[offset | 10] = SA;
            HEAP[offset | 11] = SB;
            HEAP[offset | 12] = SC;
            HEAP[offset | 13] = SD;
            HEAP[offset | 14] = SE;
            HEAP[offset | 15] = SF;
        }
        function init_key_128(k0, k1, k2, k3, k4, k5, k6, k7, k8, k9, kA, kB, kC, kD, kE, kF) {
            k0 = k0 | 0;
            k1 = k1 | 0;
            k2 = k2 | 0;
            k3 = k3 | 0;
            k4 = k4 | 0;
            k5 = k5 | 0;
            k6 = k6 | 0;
            k7 = k7 | 0;
            k8 = k8 | 0;
            k9 = k9 | 0;
            kA = kA | 0;
            kB = kB | 0;
            kC = kC | 0;
            kD = kD | 0;
            kE = kE | 0;
            kF = kF | 0;
            R00 = k0;
            R01 = k1;
            R02 = k2;
            R03 = k3;
            R04 = k4;
            R05 = k5;
            R06 = k6;
            R07 = k7;
            R08 = k8;
            R09 = k9;
            R0A = kA;
            R0B = kB;
            R0C = kC;
            R0D = kD;
            R0E = kE;
            R0F = kF;
            _expand_key_128();
        }
        function cbc_encrypt(offset, length) {
            offset = offset | 0;
            length = length | 0;
            var encrypted = 0;
            if (offset & 15) return -1;
            while ((length | 0) >= 16) {
                _encrypt_128(S0 ^ HEAP[offset], S1 ^ HEAP[offset | 1], S2 ^ HEAP[offset | 2], S3 ^ HEAP[offset | 3], S4 ^ HEAP[offset | 4], S5 ^ HEAP[offset | 5], S6 ^ HEAP[offset | 6], S7 ^ HEAP[offset | 7], S8 ^ HEAP[offset | 8], S9 ^ HEAP[offset | 9], SA ^ HEAP[offset | 10], SB ^ HEAP[offset | 11], SC ^ HEAP[offset | 12], SD ^ HEAP[offset | 13], SE ^ HEAP[offset | 14], SF ^ HEAP[offset | 15]);
                HEAP[offset] = S0;
                HEAP[offset | 1] = S1;
                HEAP[offset | 2] = S2;
                HEAP[offset | 3] = S3;
                HEAP[offset | 4] = S4;
                HEAP[offset | 5] = S5;
                HEAP[offset | 6] = S6;
                HEAP[offset | 7] = S7;
                HEAP[offset | 8] = S8;
                HEAP[offset | 9] = S9;
                HEAP[offset | 10] = SA;
                HEAP[offset | 11] = SB;
                HEAP[offset | 12] = SC;
                HEAP[offset | 13] = SD;
                HEAP[offset | 14] = SE;
                HEAP[offset | 15] = SF;
                offset = offset + 16 | 0;
                length = length - 16 | 0;
                encrypted = encrypted + 16 | 0;
            }
            return encrypted | 0;
        }
        function cbc_decrypt(offset, length) {
            offset = offset | 0;
            length = length | 0;
            var iv0 = 0, iv1 = 0, iv2 = 0, iv3 = 0, iv4 = 0, iv5 = 0, iv6 = 0, iv7 = 0, iv8 = 0, iv9 = 0, ivA = 0, ivB = 0, ivC = 0, ivD = 0, ivE = 0, ivF = 0, decrypted = 0;
            if (offset & 15) return -1;
            iv0 = S0;
            iv1 = S1;
            iv2 = S2;
            iv3 = S3;
            iv4 = S4;
            iv5 = S5;
            iv6 = S6;
            iv7 = S7;
            iv8 = S8;
            iv9 = S9;
            ivA = SA;
            ivB = SB;
            ivC = SC;
            ivD = SD;
            ivE = SE;
            ivF = SF;
            while ((length | 0) >= 16) {
                _decrypt_128(HEAP[offset] | 0, HEAP[offset | 1] | 0, HEAP[offset | 2] | 0, HEAP[offset | 3] | 0, HEAP[offset | 4] | 0, HEAP[offset | 5] | 0, HEAP[offset | 6] | 0, HEAP[offset | 7] | 0, HEAP[offset | 8] | 0, HEAP[offset | 9] | 0, HEAP[offset | 10] | 0, HEAP[offset | 11] | 0, HEAP[offset | 12] | 0, HEAP[offset | 13] | 0, HEAP[offset | 14] | 0, HEAP[offset | 15] | 0);
                S0 = S0 ^ iv0;
                iv0 = HEAP[offset] | 0;
                S1 = S1 ^ iv1;
                iv1 = HEAP[offset | 1] | 0;
                S2 = S2 ^ iv2;
                iv2 = HEAP[offset | 2] | 0;
                S3 = S3 ^ iv3;
                iv3 = HEAP[offset | 3] | 0;
                S4 = S4 ^ iv4;
                iv4 = HEAP[offset | 4] | 0;
                S5 = S5 ^ iv5;
                iv5 = HEAP[offset | 5] | 0;
                S6 = S6 ^ iv6;
                iv6 = HEAP[offset | 6] | 0;
                S7 = S7 ^ iv7;
                iv7 = HEAP[offset | 7] | 0;
                S8 = S8 ^ iv8;
                iv8 = HEAP[offset | 8] | 0;
                S9 = S9 ^ iv9;
                iv9 = HEAP[offset | 9] | 0;
                SA = SA ^ ivA;
                ivA = HEAP[offset | 10] | 0;
                SB = SB ^ ivB;
                ivB = HEAP[offset | 11] | 0;
                SC = SC ^ ivC;
                ivC = HEAP[offset | 12] | 0;
                SD = SD ^ ivD;
                ivD = HEAP[offset | 13] | 0;
                SE = SE ^ ivE;
                ivE = HEAP[offset | 14] | 0;
                SF = SF ^ ivF;
                ivF = HEAP[offset | 15] | 0;
                HEAP[offset] = S0;
                HEAP[offset | 1] = S1;
                HEAP[offset | 2] = S2;
                HEAP[offset | 3] = S3;
                HEAP[offset | 4] = S4;
                HEAP[offset | 5] = S5;
                HEAP[offset | 6] = S6;
                HEAP[offset | 7] = S7;
                HEAP[offset | 8] = S8;
                HEAP[offset | 9] = S9;
                HEAP[offset | 10] = SA;
                HEAP[offset | 11] = SB;
                HEAP[offset | 12] = SC;
                HEAP[offset | 13] = SD;
                HEAP[offset | 14] = SE;
                HEAP[offset | 15] = SF;
                offset = offset + 16 | 0;
                length = length - 16 | 0;
                decrypted = decrypted + 16 | 0;
            }
            S0 = iv0;
            S1 = iv1;
            S2 = iv2;
            S3 = iv3;
            S4 = iv4;
            S5 = iv5;
            S6 = iv6;
            S7 = iv7;
            S8 = iv8;
            S9 = iv9;
            SA = ivA;
            SB = ivB;
            SC = ivC;
            SD = ivD;
            SE = ivE;
            SF = ivF;
            return decrypted | 0;
        }
        function cbc_mac(offset, length, output) {
            offset = offset | 0;
            length = length | 0;
            output = output | 0;
            if (offset & 15) return -1;
            if (~output) if (output & 31) return -1;
            while ((length | 0) >= 16) {
                _encrypt_128(S0 ^ HEAP[offset], S1 ^ HEAP[offset | 1], S2 ^ HEAP[offset | 2], S3 ^ HEAP[offset | 3], S4 ^ HEAP[offset | 4], S5 ^ HEAP[offset | 5], S6 ^ HEAP[offset | 6], S7 ^ HEAP[offset | 7], S8 ^ HEAP[offset | 8], S9 ^ HEAP[offset | 9], SA ^ HEAP[offset | 10], SB ^ HEAP[offset | 11], SC ^ HEAP[offset | 12], SD ^ HEAP[offset | 13], SE ^ HEAP[offset | 14], SF ^ HEAP[offset | 15]);
                offset = offset + 16 | 0;
                length = length - 16 | 0;
            }
            if ((length | 0) > 0) {
                S0 = S0 ^ HEAP[offset];
                if ((length | 0) > 1) S1 = S1 ^ HEAP[offset | 1];
                if ((length | 0) > 2) S2 = S2 ^ HEAP[offset | 2];
                if ((length | 0) > 3) S3 = S3 ^ HEAP[offset | 3];
                if ((length | 0) > 4) S4 = S4 ^ HEAP[offset | 4];
                if ((length | 0) > 5) S5 = S5 ^ HEAP[offset | 5];
                if ((length | 0) > 6) S6 = S6 ^ HEAP[offset | 6];
                if ((length | 0) > 7) S7 = S7 ^ HEAP[offset | 7];
                if ((length | 0) > 8) S8 = S8 ^ HEAP[offset | 8];
                if ((length | 0) > 9) S9 = S9 ^ HEAP[offset | 9];
                if ((length | 0) > 10) SA = SA ^ HEAP[offset | 10];
                if ((length | 0) > 11) SB = SB ^ HEAP[offset | 11];
                if ((length | 0) > 12) SC = SC ^ HEAP[offset | 12];
                if ((length | 0) > 13) SD = SD ^ HEAP[offset | 13];
                if ((length | 0) > 14) SE = SE ^ HEAP[offset | 14];
                _encrypt_128(S0, S1, S2, S3, S4, S5, S6, S7, S8, S9, SA, SB, SC, SD, SE, SF);
                offset = offset + length | 0;
                length = 0;
            }
            if (~output) {
                HEAP[output | 0] = S0;
                HEAP[output | 1] = S1;
                HEAP[output | 2] = S2;
                HEAP[output | 3] = S3;
                HEAP[output | 4] = S4;
                HEAP[output | 5] = S5;
                HEAP[output | 6] = S6;
                HEAP[output | 7] = S7;
                HEAP[output | 8] = S8;
                HEAP[output | 9] = S9;
                HEAP[output | 10] = SA;
                HEAP[output | 11] = SB;
                HEAP[output | 12] = SC;
                HEAP[output | 13] = SD;
                HEAP[output | 14] = SE;
                HEAP[output | 15] = SF;
            }
            return 0;
        }
        function ccm_encrypt(offset, length, nonce0, nonce1, nonce2, nonce3, nonce4, nonce5, nonce6, nonce7, nonce8, nonce9, nonceA, nonceB, nonceC, nonceD, counter0, counter1) {
            offset = offset | 0;
            length = length | 0;
            nonce0 = nonce0 | 0;
            nonce1 = nonce1 | 0;
            nonce2 = nonce2 | 0;
            nonce3 = nonce3 | 0;
            nonce4 = nonce4 | 0;
            nonce5 = nonce5 | 0;
            nonce6 = nonce6 | 0;
            nonce7 = nonce7 | 0;
            nonce8 = nonce8 | 0;
            nonce9 = nonce9 | 0;
            nonceA = nonceA | 0;
            nonceB = nonceB | 0;
            nonceC = nonceC | 0;
            nonceD = nonceD | 0;
            counter0 = counter0 | 0;
            counter1 = counter1 | 0;
            var iv0 = 0, iv1 = 0, iv2 = 0, iv3 = 0, iv4 = 0, iv5 = 0, iv6 = 0, iv7 = 0, iv8 = 0, iv9 = 0, ivA = 0, ivB = 0, ivC = 0, ivD = 0, ivE = 0, ivF = 0, s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, s8 = 0, s9 = 0, sA = 0, sB = 0, sC = 0, sD = 0, sE = 0, sF = 0, encrypted = 0;
            if (offset & 15) return -1;
            iv0 = S0, iv1 = S1, iv2 = S2, iv3 = S3, iv4 = S4, iv5 = S5, iv6 = S6, iv7 = S7, 
            iv8 = S8, iv9 = S9, ivA = SA, ivB = SB, ivC = SC, ivD = SD, ivE = SE, ivF = SF;
            while ((length | 0) >= 16) {
                s0 = HEAP[offset] | 0;
                s1 = HEAP[offset | 1] | 0;
                s2 = HEAP[offset | 2] | 0;
                s3 = HEAP[offset | 3] | 0;
                s4 = HEAP[offset | 4] | 0;
                s5 = HEAP[offset | 5] | 0;
                s6 = HEAP[offset | 6] | 0;
                s7 = HEAP[offset | 7] | 0;
                s8 = HEAP[offset | 8] | 0;
                s9 = HEAP[offset | 9] | 0;
                sA = HEAP[offset | 10] | 0;
                sB = HEAP[offset | 11] | 0;
                sC = HEAP[offset | 12] | 0;
                sD = HEAP[offset | 13] | 0;
                sE = HEAP[offset | 14] | 0;
                sF = HEAP[offset | 15] | 0;
                _encrypt_128(nonce0, nonce1, nonce2, nonce3, nonce4, nonce5, nonce6, nonce7, nonce8 ^ counter0 >>> 24, nonce9 ^ counter0 >>> 16 & 255, nonceA ^ counter0 >>> 8 & 255, nonceB ^ counter0 & 255, nonceC ^ counter1 >>> 24, nonceD ^ counter1 >>> 16 & 255, counter1 >>> 8 & 255, counter1 & 255);
                HEAP[offset] = s0 ^ S0;
                HEAP[offset | 1] = s1 ^ S1;
                HEAP[offset | 2] = s2 ^ S2;
                HEAP[offset | 3] = s3 ^ S3;
                HEAP[offset | 4] = s4 ^ S4;
                HEAP[offset | 5] = s5 ^ S5;
                HEAP[offset | 6] = s6 ^ S6;
                HEAP[offset | 7] = s7 ^ S7;
                HEAP[offset | 8] = s8 ^ S8;
                HEAP[offset | 9] = s9 ^ S9;
                HEAP[offset | 10] = sA ^ SA;
                HEAP[offset | 11] = sB ^ SB;
                HEAP[offset | 12] = sC ^ SC;
                HEAP[offset | 13] = sD ^ SD;
                HEAP[offset | 14] = sE ^ SE;
                HEAP[offset | 15] = sF ^ SF;
                _encrypt_128(s0 ^ iv0, s1 ^ iv1, s2 ^ iv2, s3 ^ iv3, s4 ^ iv4, s5 ^ iv5, s6 ^ iv6, s7 ^ iv7, s8 ^ iv8, s9 ^ iv9, sA ^ ivA, sB ^ ivB, sC ^ ivC, sD ^ ivD, sE ^ ivE, sF ^ ivF);
                iv0 = S0, iv1 = S1, iv2 = S2, iv3 = S3, iv4 = S4, iv5 = S5, iv6 = S6, iv7 = S7, 
                iv8 = S8, iv9 = S9, ivA = SA, ivB = SB, ivC = SC, ivD = SD, ivE = SE, ivF = SF;                
                encrypted = encrypted + 16 | 0;
                offset = offset + 16 | 0;
                length = length - 16 | 0;
                counter1 = counter1 + 1 | 0;
                if ((counter1 | 0) == 0) counter0 = counter0 + 1 | 0;
            }
            if ((length | 0) > 0) {
                s0 = HEAP[offset] | 0;
                s1 = (length | 0) > 1 ? HEAP[offset | 1] | 0 : 0;
                s2 = (length | 0) > 2 ? HEAP[offset | 2] | 0 : 0;
                s3 = (length | 0) > 3 ? HEAP[offset | 3] | 0 : 0;
                s4 = (length | 0) > 4 ? HEAP[offset | 4] | 0 : 0;
                s5 = (length | 0) > 5 ? HEAP[offset | 5] | 0 : 0;
                s6 = (length | 0) > 6 ? HEAP[offset | 6] | 0 : 0;
                s7 = (length | 0) > 7 ? HEAP[offset | 7] | 0 : 0;
                s8 = (length | 0) > 8 ? HEAP[offset | 8] | 0 : 0;
                s9 = (length | 0) > 9 ? HEAP[offset | 9] | 0 : 0;
                sA = (length | 0) > 10 ? HEAP[offset | 10] | 0 : 0;
                sB = (length | 0) > 11 ? HEAP[offset | 11] | 0 : 0;
                sC = (length | 0) > 12 ? HEAP[offset | 12] | 0 : 0;
                sD = (length | 0) > 13 ? HEAP[offset | 13] | 0 : 0;
                sE = (length | 0) > 14 ? HEAP[offset | 14] | 0 : 0;
                _encrypt_128(nonce0, nonce1, nonce2, nonce3, nonce4, nonce5, nonce6, nonce7, nonce8 ^ counter0 >>> 24, nonce9 ^ counter0 >>> 16 & 255, nonceA ^ counter0 >>> 8 & 255, nonceB ^ counter0 & 255, nonceC ^ counter1 >>> 24, nonceD ^ counter1 >>> 16 & 255, counter1 >>> 8 & 255, counter1 & 255);
                HEAP[offset] = s0 ^ S0;
                if ((length | 0) > 1) HEAP[offset | 1] = s1 ^ S1;
                if ((length | 0) > 2) HEAP[offset | 2] = s2 ^ S2;
                if ((length | 0) > 3) HEAP[offset | 3] = s3 ^ S3;
                if ((length | 0) > 4) HEAP[offset | 4] = s4 ^ S4;
                if ((length | 0) > 5) HEAP[offset | 5] = s5 ^ S5;
                if ((length | 0) > 6) HEAP[offset | 6] = s6 ^ S6;
                if ((length | 0) > 7) HEAP[offset | 7] = s7 ^ S7;
                if ((length | 0) > 8) HEAP[offset | 8] = s8 ^ S8;
                if ((length | 0) > 9) HEAP[offset | 9] = s9 ^ S9;
                if ((length | 0) > 10) HEAP[offset | 10] = sA ^ SA;
                if ((length | 0) > 11) HEAP[offset | 11] = sB ^ SB;
                if ((length | 0) > 12) HEAP[offset | 12] = sC ^ SC;
                if ((length | 0) > 13) HEAP[offset | 13] = sD ^ SD;
                if ((length | 0) > 14) HEAP[offset | 14] = sE ^ SE;
                _encrypt_128(s0 ^ iv0, s1 ^ iv1, s2 ^ iv2, s3 ^ iv3, s4 ^ iv4, s5 ^ iv5, s6 ^ iv6, s7 ^ iv7, s8 ^ iv8, s9 ^ iv9, sA ^ ivA, sB ^ ivB, sC ^ ivC, sD ^ ivD, sE ^ ivE, ivF);
                iv0 = S0, iv1 = S1, iv2 = S2, iv3 = S3, iv4 = S4, iv5 = S5, iv6 = S6, iv7 = S7, 
                iv8 = S8, iv9 = S9, ivA = SA, ivB = SB, ivC = SC, ivD = SD, ivE = SE, ivF = SF;
                encrypted = encrypted + length | 0;
                offset = offset + length | 0;
                length = 0;
                counter1 = counter1 + 1 | 0;
                if ((counter1 | 0) == 0) counter0 = counter0 + 1 | 0;
            }
            return encrypted | 0;
        }
        function ccm_decrypt(offset, length, nonce0, nonce1, nonce2, nonce3, nonce4, nonce5, nonce6, nonce7, nonce8, nonce9, nonceA, nonceB, nonceC, nonceD, counter0, counter1) {
            offset = offset | 0;
            length = length | 0;
            nonce0 = nonce0 | 0;
            nonce1 = nonce1 | 0;
            nonce2 = nonce2 | 0;
            nonce3 = nonce3 | 0;
            nonce4 = nonce4 | 0;
            nonce5 = nonce5 | 0;
            nonce6 = nonce6 | 0;
            nonce7 = nonce7 | 0;
            nonce8 = nonce8 | 0;
            nonce9 = nonce9 | 0;
            nonceA = nonceA | 0;
            nonceB = nonceB | 0;
            nonceC = nonceC | 0;
            nonceD = nonceD | 0;
            counter0 = counter0 | 0;
            counter1 = counter1 | 0;
            var iv0 = 0, iv1 = 0, iv2 = 0, iv3 = 0, iv4 = 0, iv5 = 0, iv6 = 0, iv7 = 0, iv8 = 0, iv9 = 0, ivA = 0, ivB = 0, ivC = 0, ivD = 0, ivE = 0, ivF = 0, s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, s8 = 0, s9 = 0, sA = 0, sB = 0, sC = 0, sD = 0, sE = 0, sF = 0, decrypted = 0;
            if (offset & 15) return -1;
            iv0 = S0, iv1 = S1, iv2 = S2, iv3 = S3, iv4 = S4, iv5 = S5, iv6 = S6, iv7 = S7, 
            iv8 = S8, iv9 = S9, ivA = SA, ivB = SB, ivC = SC, ivD = SD, ivE = SE, ivF = SF;
            while ((length | 0) >= 16) {
                _encrypt_128(nonce0, nonce1, nonce2, nonce3, nonce4, nonce5, nonce6, nonce7, nonce8 ^ counter0 >>> 24, nonce9 ^ counter0 >>> 16 & 255, nonceA ^ counter0 >>> 8 & 255, nonceB ^ counter0 & 255, nonceC ^ counter1 >>> 24, nonceD ^ counter1 >>> 16 & 255, counter1 >>> 8 & 255, counter1 & 255);
                HEAP[offset] = s0 = HEAP[offset] ^ S0;
                HEAP[offset | 1] = s1 = HEAP[offset | 1] ^ S1;
                HEAP[offset | 2] = s2 = HEAP[offset | 2] ^ S2;
                HEAP[offset | 3] = s3 = HEAP[offset | 3] ^ S3;
                HEAP[offset | 4] = s4 = HEAP[offset | 4] ^ S4;
                HEAP[offset | 5] = s5 = HEAP[offset | 5] ^ S5;
                HEAP[offset | 6] = s6 = HEAP[offset | 6] ^ S6;
                HEAP[offset | 7] = s7 = HEAP[offset | 7] ^ S7;
                HEAP[offset | 8] = s8 = HEAP[offset | 8] ^ S8;
                HEAP[offset | 9] = s9 = HEAP[offset | 9] ^ S9;
                HEAP[offset | 10] = sA = HEAP[offset | 10] ^ SA;
                HEAP[offset | 11] = sB = HEAP[offset | 11] ^ SB;
                HEAP[offset | 12] = sC = HEAP[offset | 12] ^ SC;
                HEAP[offset | 13] = sD = HEAP[offset | 13] ^ SD;
                HEAP[offset | 14] = sE = HEAP[offset | 14] ^ SE;
                HEAP[offset | 15] = sF = HEAP[offset | 15] ^ SF;
                _encrypt_128(s0 ^ iv0, s1 ^ iv1, s2 ^ iv2, s3 ^ iv3, s4 ^ iv4, s5 ^ iv5, s6 ^ iv6, s7 ^ iv7, s8 ^ iv8, s9 ^ iv9, sA ^ ivA, sB ^ ivB, sC ^ ivC, sD ^ ivD, sE ^ ivE, sF ^ ivF);
                iv0 = S0, iv1 = S1, iv2 = S2, iv3 = S3, iv4 = S4, iv5 = S5, iv6 = S6, iv7 = S7, 
                iv8 = S8, iv9 = S9, ivA = SA, ivB = SB, ivC = SC, ivD = SD, ivE = SE, ivF = SF;
                decrypted = decrypted + 16 | 0;
                offset = offset + 16 | 0;
                length = length - 16 | 0;
                counter1 = counter1 + 1 | 0;
                if ((counter1 | 0) == 0) counter0 = counter0 + 1 | 0;
            }
            if ((length | 0) > 0) {
                _encrypt_128(nonce0, nonce1, nonce2, nonce3, nonce4, nonce5, nonce6, nonce7, nonce8 ^ counter0 >>> 24, nonce9 ^ counter0 >>> 16 & 255, nonceA ^ counter0 >>> 8 & 255, nonceB ^ counter0 & 255, nonceC ^ counter1 >>> 24, nonceD ^ counter1 >>> 16 & 255, counter1 >>> 8 & 255, counter1 & 255);
                s0 = HEAP[offset] ^ S0;
                s1 = (length | 0) > 1 ? HEAP[offset | 1] ^ S1 : 0;
                s2 = (length | 0) > 2 ? HEAP[offset | 2] ^ S2 : 0;
                s3 = (length | 0) > 3 ? HEAP[offset | 3] ^ S3 : 0;
                s4 = (length | 0) > 4 ? HEAP[offset | 4] ^ S4 : 0;
                s5 = (length | 0) > 5 ? HEAP[offset | 5] ^ S5 : 0;
                s6 = (length | 0) > 6 ? HEAP[offset | 6] ^ S6 : 0;
                s7 = (length | 0) > 7 ? HEAP[offset | 7] ^ S7 : 0;
                s8 = (length | 0) > 8 ? HEAP[offset | 8] ^ S8 : 0;
                s9 = (length | 0) > 9 ? HEAP[offset | 9] ^ S9 : 0;
                sA = (length | 0) > 10 ? HEAP[offset | 10] ^ SA : 0;
                sB = (length | 0) > 11 ? HEAP[offset | 11] ^ SB : 0;
                sC = (length | 0) > 12 ? HEAP[offset | 12] ^ SC : 0;
                sD = (length | 0) > 13 ? HEAP[offset | 13] ^ SD : 0;
                sE = (length | 0) > 14 ? HEAP[offset | 14] ^ SE : 0;
                sF = (length | 0) > 15 ? HEAP[offset | 15] ^ SF : 0;
                HEAP[offset] = s0;
                if ((length | 0) > 1) HEAP[offset | 1] = s1;
                if ((length | 0) > 2) HEAP[offset | 2] = s2;
                if ((length | 0) > 3) HEAP[offset | 3] = s3;
                if ((length | 0) > 4) HEAP[offset | 4] = s4;
                if ((length | 0) > 5) HEAP[offset | 5] = s5;
                if ((length | 0) > 6) HEAP[offset | 6] = s6;
                if ((length | 0) > 7) HEAP[offset | 7] = s7;
                if ((length | 0) > 8) HEAP[offset | 8] = s8;
                if ((length | 0) > 9) HEAP[offset | 9] = s9;
                if ((length | 0) > 10) HEAP[offset | 10] = sA;
                if ((length | 0) > 11) HEAP[offset | 11] = sB;
                if ((length | 0) > 12) HEAP[offset | 12] = sC;
                if ((length | 0) > 13) HEAP[offset | 13] = sD;
                if ((length | 0) > 14) HEAP[offset | 14] = sE;
                _encrypt_128(s0 ^ iv0, s1 ^ iv1, s2 ^ iv2, s3 ^ iv3, s4 ^ iv4, s5 ^ iv5, s6 ^ iv6, s7 ^ iv7, s8 ^ iv8, s9 ^ iv9, sA ^ ivA, sB ^ ivB, sC ^ ivC, sD ^ ivD, sE ^ ivE, sF ^ ivF);
                iv0 = S0, iv1 = S1, iv2 = S2, iv3 = S3, iv4 = S4, iv5 = S5, iv6 = S6, iv7 = S7, 
                iv8 = S8, iv9 = S9, ivA = SA, ivB = SB, ivC = SC, ivD = SD, ivE = SE, ivF = SF;
                decrypted = decrypted + length | 0;
                offset = offset + length | 0;
                length = 0;
                counter1 = counter1 + 1 | 0;
                if ((counter1 | 0) == 0) counter0 = counter0 + 1 | 0;
            }
            return decrypted | 0;
        }
        return {
            init_state: init_state,
            save_state: save_state,
            init_key_128: init_key_128,
            cbc_encrypt: cbc_encrypt,
            cbc_decrypt: cbc_decrypt,
            cbc_mac: cbc_mac,
            ccm_encrypt: ccm_encrypt,
            ccm_decrypt: ccm_decrypt
        };
    }
    function aes_asm(stdlib, foreign, buffer) {
        var heap = new Uint8Array(buffer);
        heap.set(_aes_tables);
        return _aes_asm(stdlib, foreign, buffer);
    }
    var _aes_block_size = 16;
    function _aes_constructor(options) {
        options = options || {};
        options.heapSize = options.heapSize || 4096;
        if (options.heapSize <= 0 || options.heapSize % 4096) throw new IllegalArgumentError("heapSize must be a positive number and multiple of 4096");
        this.BLOCK_SIZE = _aes_block_size;
        this.KEY_SIZE = 16;
        this.heap = options.heap || new Uint8Array(options.heapSize);
        this.asm = options.asm || aes_asm(global, null, this.heap.buffer);
        this.pos = _aes_heap_start;
        this.len = 0;
        this.key = null;
        this.result = null;
        this.reset(options);
    }
    function _aes_reset(options) {
        options = options || {};
        this.result = null;
        this.pos = _aes_heap_start;
        this.len = 0;
        var asm = this.asm;
        var key = options.key;
        if (key !== undefined) {
            if (is_buffer(key) || is_bytes(key)) {
                key = new Uint8Array(key);
            } else if (is_string(key)) {
                var str = key;
                key = new Uint8Array(str.length);
                for (var i = 0; i < str.length; ++i) key[i] = str.charCodeAt(i);
            } else {
                throw new TypeError("unexpected key type");
            }
            if (key.length !== this.KEY_SIZE) throw new IllegalArgumentError("illegal key size");
            this.key = key;
            asm.init_key_128.call(asm, key[0], key[1], key[2], key[3], key[4], key[5], key[6], key[7], key[8], key[9], key[10], key[11], key[12], key[13], key[14], key[15]);
        }
        return this;
    }
    function _aes_init_iv(iv) {
        var asm = this.asm;
        if (iv !== undefined) {
            if (is_buffer(iv) || is_bytes(iv)) {
                iv = new Uint8Array(iv);
            } else if (is_string(iv)) {
                var str = iv;
                iv = new Uint8Array(str.length);
                for (var i = 0; i < str.length; ++i) iv[i] = str.charCodeAt(i);
            } else {
                throw new TypeError("unexpected iv type");
            }
            if (iv.length !== _aes_block_size) throw new IllegalArgumentError("illegal iv size");
            this.iv = iv;
            asm.init_state.call(asm, iv[0], iv[1], iv[2], iv[3], iv[4], iv[5], iv[6], iv[7], iv[8], iv[9], iv[10], iv[11], iv[12], iv[13], iv[14], iv[15]);
        } else {
            this.iv = null;
            asm.init_state.call(asm, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
        }
    }
    function _aes_heap_write(heap, hpos, data, dpos, dlen) {
        var hlen = heap.byteLength - hpos, wlen = hlen < dlen ? hlen : dlen;
        if (is_buffer(data) || is_bytes(data)) {
            heap.set(new Uint8Array(data.buffer || data, dpos, wlen), hpos);
        } else if (is_string(data)) {
            for (var i = 0; i < wlen; ++i) heap[hpos + i] = data.charCodeAt(dpos + i);
        } else {
            throw new TypeError("unexpected data type");
        }
        return wlen;
    }
    function cbc_aes_constructor(options) {
        this.padding = true;
        this.mode = "cbc";
        this.iv = null;
        _aes_constructor.call(this, options);
    }
    function cbc_aes_encrypt_constructor(options) {
        cbc_aes_constructor.call(this, options);
    }
    function cbc_aes_decrypt_constructor(options) {
        cbc_aes_constructor.call(this, options);
    }
    function cbc_aes_reset(options) {
        options = options || {};
        _aes_reset.call(this, options);
        var padding = options.padding;
        if (padding !== undefined) {
            this.padding = !!padding;
        } else {
            this.padding = true;
        }
        _aes_init_iv.call(this, options.iv);
        return this;
    }
    function cbc_aes_encrypt_process(data) {
        if (!this.key) throw new IllegalStateError("no key is associated with the instance");
        var dpos = data.byteOffset || 0, dlen = data.byteLength || data.length || 0, asm = this.asm, heap = this.heap, pos = this.pos, len = this.len, rpos = 0, rlen = _aes_block_size * Math.floor((len + dlen) / _aes_block_size), wlen = 0;
        var result = new Uint8Array(rlen);
        while (dlen > 0) {
            wlen = _aes_heap_write(heap, pos + len, data, dpos, dlen);
            len += wlen;
            dpos += wlen;
            dlen -= wlen;
            wlen = asm.cbc_encrypt(pos, len);
            result.set(heap.subarray(pos, pos + wlen), rpos);
            rpos += wlen;
            if (wlen < len) {
                pos += wlen;
                len -= wlen;
            } else {
                pos = _aes_heap_start;
                len = 0;
            }
        }
        this.result = result;
        this.pos = pos;
        this.len = len;
        return this;
    }
    function cbc_aes_encrypt_finish() {
        if (!this.key) throw new IllegalStateError("no key is associated with the instance");
        var asm = this.asm, heap = this.heap, padding = this.padding, pos = this.pos, len = this.len, rlen = _aes_block_size * Math.ceil(len / _aes_block_size);
        if (len % _aes_block_size === 0) {
            if (padding) rlen += _aes_block_size;
        } else if (!padding) {
            throw new IllegalArgumentError("data length must be a multiple of " + _aes_block_size);
        }
        var result = new Uint8Array(rlen);
        if (len < rlen) {
            var plen = _aes_block_size - len % _aes_block_size;
            for (var p = 0; p < plen; ++p) heap[pos + len + p] = plen;
            len += plen;
        }
        asm.cbc_encrypt(pos, len);
        result.set(heap.subarray(pos, pos + len));
        this.result = result;
        this.pos = _aes_heap_start;
        this.len = 0;
        return this;
    }
    function cbc_aes_encrypt(data) {
        var result1 = cbc_aes_encrypt_process.call(this, data).result, result2 = cbc_aes_encrypt_finish.call(this).result, result;
        result = new Uint8Array(result1.length + result2.length);
        result.set(result1);
        result.set(result2, result1.length);
        this.result = result;
        return this;
    }
    function cbc_aes_decrypt_process(data) {
        if (!this.key) throw new IllegalStateError("no key is associated with the instance");
        var dpos = data.byteOffset || 0, dlen = data.byteLength || data.length || 0, asm = this.asm, heap = this.heap, padding = this.padding, pos = this.pos, len = this.len, rpos = 0, rlen = _aes_block_size * Math.floor((len + dlen) / _aes_block_size), wlen = 0;
        var result = new Uint8Array(rlen);
        while (dlen > 0) {
            wlen = _aes_heap_write(heap, pos + len, data, dpos, dlen);
            len += wlen;
            dpos += wlen;
            dlen -= wlen;
            wlen = asm.cbc_decrypt(pos, len - (padding && dlen === 0 && len % _aes_block_size === 0 ? _aes_block_size : 0));
            result.set(heap.subarray(pos, pos + wlen), rpos);
            rpos += wlen;
            if (wlen < len) {
                pos += wlen;
                len -= wlen;
            } else {
                pos = _aes_heap_start;
                len = 0;
            }
        }
        this.result = result.subarray(0, rpos);
        this.pos = pos;
        this.len = len;
        return this;
    }
    function cbc_aes_decrypt_finish() {
        if (!this.key) throw new IllegalStateError("no key is associated with the instance");
        var asm = this.asm, heap = this.heap, padding = this.padding, pos = this.pos, len = this.len;
        if (len === 0) {
            if (!padding) {
                this.result = new Uint8Array(0);
                this.pos = _aes_heap_start;
                this.len = 0;
                return this;
            } else {
                throw new IllegalStateError("padding not found");
            }
        }
        if (len % _aes_block_size !== 0) throw new IllegalArgumentError("data length must be a multiple of " + _aes_block_size);
        var result = new Uint8Array(len);
        asm.cbc_decrypt(pos, len);
        result.set(heap.subarray(pos, pos + len));
        if (padding) {
            var pad = result[len - 1];
            result = result.subarray(0, len - pad);
        }
        this.result = result;
        this.pos = _aes_heap_start;
        this.len = 0;
        return this;
    }
    function cbc_aes_decrypt(data) {
        var result1 = cbc_aes_decrypt_process.call(this, data).result, result2 = cbc_aes_decrypt_finish.call(this).result, result;
        result = new Uint8Array(result1.length + result2.length);
        result.set(result1);
        result.set(result2, result1.length);
        this.result = result;
        return this;
    }
    var cbc_aes_encrypt_prototype = cbc_aes_encrypt_constructor.prototype;
    cbc_aes_encrypt_prototype.reset = cbc_aes_reset;
    cbc_aes_encrypt_prototype.process = cbc_aes_encrypt_process;
    cbc_aes_encrypt_prototype.finish = cbc_aes_encrypt_finish;
    var cbc_aes_decrypt_prototype = cbc_aes_decrypt_constructor.prototype;
    cbc_aes_decrypt_prototype.reset = cbc_aes_reset;
    cbc_aes_decrypt_prototype.process = cbc_aes_decrypt_process;
    cbc_aes_decrypt_prototype.finish = cbc_aes_decrypt_finish;
    var cbc_aes_prototype = cbc_aes_constructor.prototype;
    cbc_aes_prototype.reset = cbc_aes_reset;
    cbc_aes_prototype.encrypt = cbc_aes_encrypt;
    cbc_aes_prototype.decrypt = cbc_aes_decrypt;
    function _cbc_mac_process(data) {
        var dpos = data.byteOffset || 0, dlen = data.byteLength || data.length || 0, wlen = 0;
        while (dlen > 0) {
            wlen = _aes_heap_write(this.heap, _aes_heap_start, data, dpos, dlen);
            this.asm.cbc_mac(_aes_heap_start, wlen, -1);
            dpos += wlen;
            dlen -= wlen;
        }
    }
    var _ccm_adata_maxLength = 65279, _ccm_data_maxLength = 68719476720;
    function ccm_aes_constructor(options) {
        this.padding = false;
        this.mode = "ccm";
        this.tagSize = _aes_block_size;
        this.lengthSize = 4;
        this.nonce = null;
        this.adata = null;
        this.iv = null;
        this.dataLength = -1;
        this.dataLeft = -1;
        this.counter = 1;
        _aes_constructor.call(this, options);
    }
    function ccm_aes_encrypt_constructor(options) {
        ccm_aes_constructor.call(this, options);
    }
    function ccm_aes_decrypt_constructor(options) {
        ccm_aes_constructor.call(this, options);
    }
    function _ccm_calculate_iv() {
        var nonce = this.nonce, adata = this.adata, tagSize = this.tagSize, lengthSize = this.lengthSize, dataLength = this.dataLength;
        var data = new Uint8Array(_aes_block_size + (adata ? 2 + adata.byteLength : 0));
        data[0] = (adata ? 64 : 0) | tagSize - 2 << 2 | lengthSize - 1;
        data.set(nonce, 1);
        if (lengthSize > 4) data[11] = (dataLength - (dataLength >>> 0)) / 4294967296 & 15;
        if (lengthSize > 3) data[12] = dataLength >>> 24;
        if (lengthSize > 2) data[13] = dataLength >>> 16 & 255;
        data[14] = dataLength >>> 8 & 255;
        data[15] = dataLength & 255;
        if (adata) {
            data[16] = adata.byteLength >>> 8 & 255;
            data[17] = adata.byteLength & 255;
            data.set(adata, 18);
        }
        _cbc_mac_process.call(this, data);
        this.asm.save_state(_aes_heap_start);
        this.iv = new Uint8Array(this.heap.subarray(_aes_heap_start, _aes_heap_start + _aes_block_size));
    }
    function ccm_aes_reset(options) {
        options = options || {};
        _aes_reset.call(this, options);
        _aes_init_iv.call(this, options.iv);
        var tagSize = options.tagSize;
        if (tagSize !== undefined) {
            if (!is_number(tagSize)) throw new TypeError("tagSize must be a number");
            if (tagSize < 4 || tagSize > 16 || tagSize & 1) throw new IllegalArgumentError("illegal tagSize value");
            this.tagSize = tagSize;
        } else {
            this.tagSize = _aes_block_size;
        }
        var lengthSize = options.lengthSize, nonce = options.nonce;
        if (nonce !== undefined) {
            if (is_buffer(nonce) || is_bytes(nonce)) {
                nonce = new Uint8Array(nonce);
            } else if (is_string(nonce)) {
                var str = nonce;
                nonce = new Uint8Array(str.length);
                for (var i = 0; i < str.length; ++i) nonce[i] = str.charCodeAt(i);
            } else {
                throw new TypeError("unexpected nonce type");
            }
            if (nonce.length < 10 || nonce.length > 13) throw new IllegalArgumentError("illegal nonce length");
            lengthSize = lengthSize || 15 - nonce.length;
            this.nonce = nonce;
        } else {
            this.nonce = null;
        }
        if (lengthSize !== undefined) {
            if (!is_number(lengthSize)) throw new TypeError("lengthSize must be a number");
            if (lengthSize < 2 || lengthSize > 5 || nonce.length + lengthSize !== 15) throw new IllegalArgumentError("illegal lengthSize value");
            this.lengthSize = lengthSize;
        } else {
            this.lengthSize = lengthSize = 4;
        }
        var iv = this.iv;
        var counter = options.counter;
        if (counter !== undefined) {
            if (iv === null) throw new IllegalStateError("iv is also required");
            if (!is_number(counter)) throw new TypeError("counter must be a number");
            this.counter = counter;
        } else {
            this.counter = 1;
        }
        var dataLength = options.dataLength;
        if (dataLength !== undefined) {
            if (!is_number(dataLength)) throw new TypeError("dataLength must be a number");
            if (dataLength < 0 || dataLength > _ccm_data_maxLength || dataLength > Math.pow(2, 8 * lengthSize) - 1) throw new IllegalArgumentError("illegal dataLength value");
            this.dataLength = dataLength;
            var dataLeft = options.dataLeft || dataLength;
            if (!is_number(dataLeft)) throw new TypeError("dataLeft must be a number");
            if (dataLeft < 0 || dataLeft > dataLength) throw new IllegalArgumentError("illegal dataLeft value");
            this.dataLeft = dataLeft;
        } else {
            this.dataLength = dataLength = -1;
            this.dataLeft = dataLength;
        }
        var adata = options.adata;
        if (adata !== undefined) {
            if (iv !== null) throw new IllegalStateError("you must specify either adata or iv, not both");
            if (is_buffer(adata) || is_bytes(adata)) {
                adata = new Uint8Array(adata);
            } else if (is_string(adata)) {
                var str = adata;
                adata = new Uint8Array(str.length);
                for (var i = 0; i < str.length; ++i) adata[i] = str.charCodeAt(i);
            } else {
                throw new TypeError("unexpected adata type");
            }
            if (adata.byteLength === 0 || adata.byteLength > _ccm_adata_maxLength) throw new IllegalArgumentError("illegal adata length");
            this.adata = adata;
            this.counter = 1;
        } else {
            this.adata = adata = null;
        }
        if (dataLength !== -1) _ccm_calculate_iv.call(this);
        return this;
    }
    function ccm_aes_encrypt_process(data) {
        if (!this.key) throw new IllegalStateError("no key is associated with the instance");
        var dpos = data.byteOffset || 0, dlen = data.byteLength || data.length || 0, asm = this.asm, heap = this.heap, nonce = this.nonce, counter = this.counter, pos = this.pos, len = this.len, rpos = 0, rlen = _aes_block_size * Math.floor((len + dlen) / _aes_block_size), wlen = 0;
        if ((counter - 1 << 4) + len + dlen > _ccm_data_maxLength) throw new RangeError("counter overflow");
        var result = new Uint8Array(rlen);
        var asm_args = [ 0, 0, this.lengthSize - 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
        for (var i = 0; i < nonce.length; i++) asm_args[3 + i] = nonce[i];
        while (dlen > 0) {
            wlen = _aes_heap_write(heap, pos + len, data, dpos, dlen);
            len += wlen;
            dpos += wlen;
            dlen -= wlen;
            asm_args[0] = pos;
            asm_args[1] = len & ~15;
            asm_args[16] = counter / 4294967296 >>> 0;
            asm_args[17] = counter >>> 0;
            wlen = asm.ccm_encrypt.apply(asm, asm_args);
            result.set(heap.subarray(pos, pos + wlen), rpos);
            counter += wlen >>> 4;
            rpos += wlen;
            if (wlen < len) {
                pos += wlen;
                len -= wlen;
            } else {
                pos = _aes_heap_start;
                len = 0;
            }
        }
        this.result = result;
        this.counter = counter;
        this.pos = pos;
        this.len = len;
        return this;
    }
    function ccm_aes_encrypt_finish() {
        if (!this.key) throw new IllegalStateError("no key is associated with the instance");
        var asm = this.asm, heap = this.heap, nonce = this.nonce, counter = this.counter, tagSize = this.tagSize, pos = this.pos, len = this.len, wlen = 0;
        var result = new Uint8Array(len + tagSize);
        var asm_args = [ 0, 0, this.lengthSize - 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
        for (var i = 0; i < nonce.length; i++) asm_args[3 + i] = nonce[i];
        asm_args[0] = pos;
        asm_args[1] = len;
        asm_args[16] = counter / 4294967296 >>> 0;
        asm_args[17] = counter >>> 0;
        wlen = asm.ccm_encrypt.apply(asm, asm_args);
        result.set(heap.subarray(pos, pos + wlen));
        counter = 1;
        pos = _aes_heap_start;
        len = 0;
        asm.save_state(_aes_heap_start);
        asm_args[0] = _aes_heap_start, asm_args[1] = _aes_block_size, asm_args[16] = 0;
        asm_args[17] = 0;
        asm.ccm_encrypt.apply(asm, asm_args);
        result.set(heap.subarray(_aes_heap_start, _aes_heap_start + tagSize), wlen);
        this.result = result;
        this.counter = counter;
        this.pos = pos;
        this.len = len;
        return this;
    }
    function ccm_aes_encrypt(data) {
        this.dataLength = this.dataLeft = data.byteLength || data.length || 0;
        var result1 = ccm_aes_encrypt_process.call(this, data).result, result2 = ccm_aes_encrypt_finish.call(this).result, result;
        result = new Uint8Array(result1.length + result2.length);
        result.set(result1);
        result.set(result2, result1.length);
        this.result = result;
        return this;
    }
    function ccm_aes_decrypt_process(data) {
        if (!this.key) throw new IllegalStateError("no key is associated with the instance");
        var dpos = data.byteOffset || 0, dlen = data.byteLength || data.length || 0, asm = this.asm, heap = this.heap, nonce = this.nonce, counter = this.counter, tagSize = this.tagSize, pos = this.pos, len = this.len, rpos = 0, rlen = _aes_block_size * Math.floor((len + dlen) / _aes_block_size), wlen = 0;
        if ((counter - 1 << 4) + len + dlen > _ccm_data_maxLength) throw new RangeError("counter overflow");
        var result = new Uint8Array(rlen);
        var asm_args = [ 0, 0, this.lengthSize - 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
        for (var i = 0; i < nonce.length; i++) asm_args[3 + i] = nonce[i];
        while (dlen > 0) {
            wlen = _aes_heap_write(heap, pos + len, data, dpos, dlen);
            len += wlen;
            dpos += wlen;
            dlen -= wlen;
            asm_args[0] = pos;
            asm_args[1] = len + dlen - tagSize >= _aes_block_size ? dlen >= tagSize ? len & ~15 : len + dlen - tagSize & ~15 : 0;
            asm_args[16] = counter / 4294967296 >>> 0;
            asm_args[17] = counter >>> 0;
            wlen = asm.ccm_decrypt.apply(asm, asm_args);
            result.set(heap.subarray(pos, pos + wlen), rpos);
            counter += wlen >>> 4;
            rpos += wlen;
            if (wlen < len) {
                pos += wlen;
                len -= wlen;
            } else {
                pos = _aes_heap_start;
                len = 0;
            }
        }
        this.result = result.subarray(0, rpos);
        this.counter = counter;
        this.pos = pos;
        this.len = len;
        return this;
    }
    function ccm_aes_decrypt_finish() {
        if (!this.key) throw new IllegalStateError("no key is associated with the instance");
        var asm = this.asm, heap = this.heap, nonce = this.nonce, counter = this.counter, tagSize = this.tagSize, pos = this.pos, len = this.len, rlen = len - tagSize, wlen = 0;
        if (len < tagSize) throw new IllegalStateError("authentication tag not found");
        var result = new Uint8Array(rlen), atag = new Uint8Array(heap.subarray(pos + rlen, pos + len));
        var asm_args = [ 0, 0, this.lengthSize - 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
        for (var i = 0; i < nonce.length; i++) asm_args[3 + i] = nonce[i];
        asm_args[0] = pos;
        asm_args[1] = rlen;
        asm_args[16] = counter / 4294967296 >>> 0;
        asm_args[17] = counter >>> 0;
        wlen = asm.ccm_decrypt.apply(asm, asm_args);
        result.set(heap.subarray(pos, pos + wlen));
        counter = 1;
        pos = _aes_heap_start;
        len = 0;
        asm.save_state(_aes_heap_start);
        asm_args[0] = _aes_heap_start, asm_args[1] = _aes_block_size, asm_args[16] = 0;
        asm_args[17] = 0;
        asm.ccm_encrypt.apply(asm, asm_args);
        var acheck = 0;
        for (var i = 0; i < tagSize; ++i) acheck |= atag[i] ^ heap[_aes_heap_start + i];
        if (acheck) throw new SecurityError("data integrity check failed");
        this.result = result;
        this.counter = counter;
        this.pos = pos;
        this.len = len;
        return this;
    }
    function ccm_aes_decrypt(data) {
        this.dataLength = this.dataLeft = data.byteLength || data.length || 0;
        var result1 = ccm_aes_decrypt_process.call(this, data).result, result2 = ccm_aes_decrypt_finish.call(this).result, result;
        result = new Uint8Array(result1.length + result2.length);
        result.set(result1);
        result.set(result2, result1.length);
        this.result = result;
        return this;
    }
    var ccm_aes_prototype = ccm_aes_constructor.prototype;
    ccm_aes_prototype.reset = ccm_aes_reset;
    ccm_aes_prototype.encrypt = ccm_aes_encrypt;
    ccm_aes_prototype.decrypt = ccm_aes_decrypt;
    var ccm_aes_encrypt_prototype = ccm_aes_encrypt_constructor.prototype;
    ccm_aes_encrypt_prototype.reset = ccm_aes_reset;
    ccm_aes_encrypt_prototype.process = ccm_aes_encrypt_process;
    ccm_aes_encrypt_prototype.finish = ccm_aes_encrypt_finish;
    var ccm_aes_decrypt_prototype = ccm_aes_decrypt_constructor.prototype;
    ccm_aes_decrypt_prototype.reset = ccm_aes_reset;
    ccm_aes_decrypt_prototype.process = ccm_aes_decrypt_process;
    ccm_aes_decrypt_prototype.finish = ccm_aes_decrypt_finish;
    function sha256_asm(stdlib, foreign, buffer) {
        "use asm";
        var H0 = 0, H1 = 0, H2 = 0, H3 = 0, H4 = 0, H5 = 0, H6 = 0, H7 = 0, TOTAL = 0;
        var I0 = 0, I1 = 0, I2 = 0, I3 = 0, I4 = 0, I5 = 0, I6 = 0, I7 = 0, O0 = 0, O1 = 0, O2 = 0, O3 = 0, O4 = 0, O5 = 0, O6 = 0, O7 = 0;
        var HEAP = new stdlib.Uint8Array(buffer);
        function _core(w0, w1, w2, w3, w4, w5, w6, w7, w8, w9, w10, w11, w12, w13, w14, w15) {
            w0 = w0 | 0;
            w1 = w1 | 0;
            w2 = w2 | 0;
            w3 = w3 | 0;
            w4 = w4 | 0;
            w5 = w5 | 0;
            w6 = w6 | 0;
            w7 = w7 | 0;
            w8 = w8 | 0;
            w9 = w9 | 0;
            w10 = w10 | 0;
            w11 = w11 | 0;
            w12 = w12 | 0;
            w13 = w13 | 0;
            w14 = w14 | 0;
            w15 = w15 | 0;
            var a = 0, b = 0, c = 0, d = 0, e = 0, f = 0, g = 0, h = 0, t = 0;
            a = H0;
            b = H1;
            c = H2;
            d = H3;
            e = H4;
            f = H5;
            g = H6;
            h = H7;
            t = w0 + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 1116352408 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            t = w1 + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 1899447441 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            t = w2 + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 3049323471 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            t = w3 + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 3921009573 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            t = w4 + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 961987163 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            t = w5 + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 1508970993 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            t = w6 + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 2453635748 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            t = w7 + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 2870763221 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            t = w8 + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 3624381080 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            t = w9 + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 310598401 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            t = w10 + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 607225278 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            t = w11 + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 1426881987 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            t = w12 + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 1925078388 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            t = w13 + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 2162078206 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            t = w14 + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 2614888103 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            t = w15 + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 3248222580 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            w0 = t = (w1 >>> 7 ^ w1 >>> 18 ^ w1 >>> 3 ^ w1 << 25 ^ w1 << 14) + (w14 >>> 17 ^ w14 >>> 19 ^ w14 >>> 10 ^ w14 << 15 ^ w14 << 13) + w0 + w9 | 0;
            t = t + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 3835390401 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            w1 = t = (w2 >>> 7 ^ w2 >>> 18 ^ w2 >>> 3 ^ w2 << 25 ^ w2 << 14) + (w15 >>> 17 ^ w15 >>> 19 ^ w15 >>> 10 ^ w15 << 15 ^ w15 << 13) + w1 + w10 | 0;
            t = t + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 4022224774 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            w2 = t = (w3 >>> 7 ^ w3 >>> 18 ^ w3 >>> 3 ^ w3 << 25 ^ w3 << 14) + (w0 >>> 17 ^ w0 >>> 19 ^ w0 >>> 10 ^ w0 << 15 ^ w0 << 13) + w2 + w11 | 0;
            t = t + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 264347078 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            w3 = t = (w4 >>> 7 ^ w4 >>> 18 ^ w4 >>> 3 ^ w4 << 25 ^ w4 << 14) + (w1 >>> 17 ^ w1 >>> 19 ^ w1 >>> 10 ^ w1 << 15 ^ w1 << 13) + w3 + w12 | 0;
            t = t + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 604807628 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            w4 = t = (w5 >>> 7 ^ w5 >>> 18 ^ w5 >>> 3 ^ w5 << 25 ^ w5 << 14) + (w2 >>> 17 ^ w2 >>> 19 ^ w2 >>> 10 ^ w2 << 15 ^ w2 << 13) + w4 + w13 | 0;
            t = t + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 770255983 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            w5 = t = (w6 >>> 7 ^ w6 >>> 18 ^ w6 >>> 3 ^ w6 << 25 ^ w6 << 14) + (w3 >>> 17 ^ w3 >>> 19 ^ w3 >>> 10 ^ w3 << 15 ^ w3 << 13) + w5 + w14 | 0;
            t = t + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 1249150122 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            w6 = t = (w7 >>> 7 ^ w7 >>> 18 ^ w7 >>> 3 ^ w7 << 25 ^ w7 << 14) + (w4 >>> 17 ^ w4 >>> 19 ^ w4 >>> 10 ^ w4 << 15 ^ w4 << 13) + w6 + w15 | 0;
            t = t + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 1555081692 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            w7 = t = (w8 >>> 7 ^ w8 >>> 18 ^ w8 >>> 3 ^ w8 << 25 ^ w8 << 14) + (w5 >>> 17 ^ w5 >>> 19 ^ w5 >>> 10 ^ w5 << 15 ^ w5 << 13) + w7 + w0 | 0;
            t = t + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 1996064986 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            w8 = t = (w9 >>> 7 ^ w9 >>> 18 ^ w9 >>> 3 ^ w9 << 25 ^ w9 << 14) + (w6 >>> 17 ^ w6 >>> 19 ^ w6 >>> 10 ^ w6 << 15 ^ w6 << 13) + w8 + w1 | 0;
            t = t + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 2554220882 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            w9 = t = (w10 >>> 7 ^ w10 >>> 18 ^ w10 >>> 3 ^ w10 << 25 ^ w10 << 14) + (w7 >>> 17 ^ w7 >>> 19 ^ w7 >>> 10 ^ w7 << 15 ^ w7 << 13) + w9 + w2 | 0;
            t = t + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 2821834349 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            w10 = t = (w11 >>> 7 ^ w11 >>> 18 ^ w11 >>> 3 ^ w11 << 25 ^ w11 << 14) + (w8 >>> 17 ^ w8 >>> 19 ^ w8 >>> 10 ^ w8 << 15 ^ w8 << 13) + w10 + w3 | 0;
            t = t + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 2952996808 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            w11 = t = (w12 >>> 7 ^ w12 >>> 18 ^ w12 >>> 3 ^ w12 << 25 ^ w12 << 14) + (w9 >>> 17 ^ w9 >>> 19 ^ w9 >>> 10 ^ w9 << 15 ^ w9 << 13) + w11 + w4 | 0;
            t = t + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 3210313671 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            w12 = t = (w13 >>> 7 ^ w13 >>> 18 ^ w13 >>> 3 ^ w13 << 25 ^ w13 << 14) + (w10 >>> 17 ^ w10 >>> 19 ^ w10 >>> 10 ^ w10 << 15 ^ w10 << 13) + w12 + w5 | 0;
            t = t + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 3336571891 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            w13 = t = (w14 >>> 7 ^ w14 >>> 18 ^ w14 >>> 3 ^ w14 << 25 ^ w14 << 14) + (w11 >>> 17 ^ w11 >>> 19 ^ w11 >>> 10 ^ w11 << 15 ^ w11 << 13) + w13 + w6 | 0;
            t = t + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 3584528711 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            w14 = t = (w15 >>> 7 ^ w15 >>> 18 ^ w15 >>> 3 ^ w15 << 25 ^ w15 << 14) + (w12 >>> 17 ^ w12 >>> 19 ^ w12 >>> 10 ^ w12 << 15 ^ w12 << 13) + w14 + w7 | 0;
            t = t + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 113926993 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            w15 = t = (w0 >>> 7 ^ w0 >>> 18 ^ w0 >>> 3 ^ w0 << 25 ^ w0 << 14) + (w13 >>> 17 ^ w13 >>> 19 ^ w13 >>> 10 ^ w13 << 15 ^ w13 << 13) + w15 + w8 | 0;
            t = t + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 338241895 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            w0 = t = (w1 >>> 7 ^ w1 >>> 18 ^ w1 >>> 3 ^ w1 << 25 ^ w1 << 14) + (w14 >>> 17 ^ w14 >>> 19 ^ w14 >>> 10 ^ w14 << 15 ^ w14 << 13) + w0 + w9 | 0;
            t = t + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 666307205 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            w1 = t = (w2 >>> 7 ^ w2 >>> 18 ^ w2 >>> 3 ^ w2 << 25 ^ w2 << 14) + (w15 >>> 17 ^ w15 >>> 19 ^ w15 >>> 10 ^ w15 << 15 ^ w15 << 13) + w1 + w10 | 0;
            t = t + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 773529912 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            w2 = t = (w3 >>> 7 ^ w3 >>> 18 ^ w3 >>> 3 ^ w3 << 25 ^ w3 << 14) + (w0 >>> 17 ^ w0 >>> 19 ^ w0 >>> 10 ^ w0 << 15 ^ w0 << 13) + w2 + w11 | 0;
            t = t + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 1294757372 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            w3 = t = (w4 >>> 7 ^ w4 >>> 18 ^ w4 >>> 3 ^ w4 << 25 ^ w4 << 14) + (w1 >>> 17 ^ w1 >>> 19 ^ w1 >>> 10 ^ w1 << 15 ^ w1 << 13) + w3 + w12 | 0;
            t = t + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 1396182291 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            w4 = t = (w5 >>> 7 ^ w5 >>> 18 ^ w5 >>> 3 ^ w5 << 25 ^ w5 << 14) + (w2 >>> 17 ^ w2 >>> 19 ^ w2 >>> 10 ^ w2 << 15 ^ w2 << 13) + w4 + w13 | 0;
            t = t + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 1695183700 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            w5 = t = (w6 >>> 7 ^ w6 >>> 18 ^ w6 >>> 3 ^ w6 << 25 ^ w6 << 14) + (w3 >>> 17 ^ w3 >>> 19 ^ w3 >>> 10 ^ w3 << 15 ^ w3 << 13) + w5 + w14 | 0;
            t = t + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 1986661051 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            w6 = t = (w7 >>> 7 ^ w7 >>> 18 ^ w7 >>> 3 ^ w7 << 25 ^ w7 << 14) + (w4 >>> 17 ^ w4 >>> 19 ^ w4 >>> 10 ^ w4 << 15 ^ w4 << 13) + w6 + w15 | 0;
            t = t + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 2177026350 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            w7 = t = (w8 >>> 7 ^ w8 >>> 18 ^ w8 >>> 3 ^ w8 << 25 ^ w8 << 14) + (w5 >>> 17 ^ w5 >>> 19 ^ w5 >>> 10 ^ w5 << 15 ^ w5 << 13) + w7 + w0 | 0;
            t = t + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 2456956037 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            w8 = t = (w9 >>> 7 ^ w9 >>> 18 ^ w9 >>> 3 ^ w9 << 25 ^ w9 << 14) + (w6 >>> 17 ^ w6 >>> 19 ^ w6 >>> 10 ^ w6 << 15 ^ w6 << 13) + w8 + w1 | 0;
            t = t + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 2730485921 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            w9 = t = (w10 >>> 7 ^ w10 >>> 18 ^ w10 >>> 3 ^ w10 << 25 ^ w10 << 14) + (w7 >>> 17 ^ w7 >>> 19 ^ w7 >>> 10 ^ w7 << 15 ^ w7 << 13) + w9 + w2 | 0;
            t = t + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 2820302411 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            w10 = t = (w11 >>> 7 ^ w11 >>> 18 ^ w11 >>> 3 ^ w11 << 25 ^ w11 << 14) + (w8 >>> 17 ^ w8 >>> 19 ^ w8 >>> 10 ^ w8 << 15 ^ w8 << 13) + w10 + w3 | 0;
            t = t + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 3259730800 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            w11 = t = (w12 >>> 7 ^ w12 >>> 18 ^ w12 >>> 3 ^ w12 << 25 ^ w12 << 14) + (w9 >>> 17 ^ w9 >>> 19 ^ w9 >>> 10 ^ w9 << 15 ^ w9 << 13) + w11 + w4 | 0;
            t = t + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 3345764771 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            w12 = t = (w13 >>> 7 ^ w13 >>> 18 ^ w13 >>> 3 ^ w13 << 25 ^ w13 << 14) + (w10 >>> 17 ^ w10 >>> 19 ^ w10 >>> 10 ^ w10 << 15 ^ w10 << 13) + w12 + w5 | 0;
            t = t + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 3516065817 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            w13 = t = (w14 >>> 7 ^ w14 >>> 18 ^ w14 >>> 3 ^ w14 << 25 ^ w14 << 14) + (w11 >>> 17 ^ w11 >>> 19 ^ w11 >>> 10 ^ w11 << 15 ^ w11 << 13) + w13 + w6 | 0;
            t = t + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 3600352804 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            w14 = t = (w15 >>> 7 ^ w15 >>> 18 ^ w15 >>> 3 ^ w15 << 25 ^ w15 << 14) + (w12 >>> 17 ^ w12 >>> 19 ^ w12 >>> 10 ^ w12 << 15 ^ w12 << 13) + w14 + w7 | 0;
            t = t + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 4094571909 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            w15 = t = (w0 >>> 7 ^ w0 >>> 18 ^ w0 >>> 3 ^ w0 << 25 ^ w0 << 14) + (w13 >>> 17 ^ w13 >>> 19 ^ w13 >>> 10 ^ w13 << 15 ^ w13 << 13) + w15 + w8 | 0;
            t = t + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 275423344 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            w0 = t = (w1 >>> 7 ^ w1 >>> 18 ^ w1 >>> 3 ^ w1 << 25 ^ w1 << 14) + (w14 >>> 17 ^ w14 >>> 19 ^ w14 >>> 10 ^ w14 << 15 ^ w14 << 13) + w0 + w9 | 0;
            t = t + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 430227734 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            w1 = t = (w2 >>> 7 ^ w2 >>> 18 ^ w2 >>> 3 ^ w2 << 25 ^ w2 << 14) + (w15 >>> 17 ^ w15 >>> 19 ^ w15 >>> 10 ^ w15 << 15 ^ w15 << 13) + w1 + w10 | 0;
            t = t + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 506948616 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            w2 = t = (w3 >>> 7 ^ w3 >>> 18 ^ w3 >>> 3 ^ w3 << 25 ^ w3 << 14) + (w0 >>> 17 ^ w0 >>> 19 ^ w0 >>> 10 ^ w0 << 15 ^ w0 << 13) + w2 + w11 | 0;
            t = t + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 659060556 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            w3 = t = (w4 >>> 7 ^ w4 >>> 18 ^ w4 >>> 3 ^ w4 << 25 ^ w4 << 14) + (w1 >>> 17 ^ w1 >>> 19 ^ w1 >>> 10 ^ w1 << 15 ^ w1 << 13) + w3 + w12 | 0;
            t = t + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 883997877 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            w4 = t = (w5 >>> 7 ^ w5 >>> 18 ^ w5 >>> 3 ^ w5 << 25 ^ w5 << 14) + (w2 >>> 17 ^ w2 >>> 19 ^ w2 >>> 10 ^ w2 << 15 ^ w2 << 13) + w4 + w13 | 0;
            t = t + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 958139571 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            w5 = t = (w6 >>> 7 ^ w6 >>> 18 ^ w6 >>> 3 ^ w6 << 25 ^ w6 << 14) + (w3 >>> 17 ^ w3 >>> 19 ^ w3 >>> 10 ^ w3 << 15 ^ w3 << 13) + w5 + w14 | 0;
            t = t + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 1322822218 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            w6 = t = (w7 >>> 7 ^ w7 >>> 18 ^ w7 >>> 3 ^ w7 << 25 ^ w7 << 14) + (w4 >>> 17 ^ w4 >>> 19 ^ w4 >>> 10 ^ w4 << 15 ^ w4 << 13) + w6 + w15 | 0;
            t = t + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 1537002063 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            w7 = t = (w8 >>> 7 ^ w8 >>> 18 ^ w8 >>> 3 ^ w8 << 25 ^ w8 << 14) + (w5 >>> 17 ^ w5 >>> 19 ^ w5 >>> 10 ^ w5 << 15 ^ w5 << 13) + w7 + w0 | 0;
            t = t + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 1747873779 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            w8 = t = (w9 >>> 7 ^ w9 >>> 18 ^ w9 >>> 3 ^ w9 << 25 ^ w9 << 14) + (w6 >>> 17 ^ w6 >>> 19 ^ w6 >>> 10 ^ w6 << 15 ^ w6 << 13) + w8 + w1 | 0;
            t = t + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 1955562222 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            w9 = t = (w10 >>> 7 ^ w10 >>> 18 ^ w10 >>> 3 ^ w10 << 25 ^ w10 << 14) + (w7 >>> 17 ^ w7 >>> 19 ^ w7 >>> 10 ^ w7 << 15 ^ w7 << 13) + w9 + w2 | 0;
            t = t + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 2024104815 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            w10 = t = (w11 >>> 7 ^ w11 >>> 18 ^ w11 >>> 3 ^ w11 << 25 ^ w11 << 14) + (w8 >>> 17 ^ w8 >>> 19 ^ w8 >>> 10 ^ w8 << 15 ^ w8 << 13) + w10 + w3 | 0;
            t = t + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 2227730452 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            w11 = t = (w12 >>> 7 ^ w12 >>> 18 ^ w12 >>> 3 ^ w12 << 25 ^ w12 << 14) + (w9 >>> 17 ^ w9 >>> 19 ^ w9 >>> 10 ^ w9 << 15 ^ w9 << 13) + w11 + w4 | 0;
            t = t + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 2361852424 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            w12 = t = (w13 >>> 7 ^ w13 >>> 18 ^ w13 >>> 3 ^ w13 << 25 ^ w13 << 14) + (w10 >>> 17 ^ w10 >>> 19 ^ w10 >>> 10 ^ w10 << 15 ^ w10 << 13) + w12 + w5 | 0;
            t = t + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 2428436474 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            w13 = t = (w14 >>> 7 ^ w14 >>> 18 ^ w14 >>> 3 ^ w14 << 25 ^ w14 << 14) + (w11 >>> 17 ^ w11 >>> 19 ^ w11 >>> 10 ^ w11 << 15 ^ w11 << 13) + w13 + w6 | 0;
            t = t + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 2756734187 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            w14 = t = (w15 >>> 7 ^ w15 >>> 18 ^ w15 >>> 3 ^ w15 << 25 ^ w15 << 14) + (w12 >>> 17 ^ w12 >>> 19 ^ w12 >>> 10 ^ w12 << 15 ^ w12 << 13) + w14 + w7 | 0;
            t = t + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 3204031479 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            w15 = t = (w0 >>> 7 ^ w0 >>> 18 ^ w0 >>> 3 ^ w0 << 25 ^ w0 << 14) + (w13 >>> 17 ^ w13 >>> 19 ^ w13 >>> 10 ^ w13 << 15 ^ w13 << 13) + w15 + w8 | 0;
            t = t + h + (e >>> 6 ^ e >>> 11 ^ e >>> 25 ^ e << 26 ^ e << 21 ^ e << 7) + (g ^ e & (f ^ g)) + 3329325298 | 0;
            h = g;
            g = f;
            f = e;
            e = d + t | 0;
            d = c;
            c = b;
            b = a;
            a = t + (b & c ^ d & (b ^ c)) + (b >>> 2 ^ b >>> 13 ^ b >>> 22 ^ b << 30 ^ b << 19 ^ b << 10) | 0;
            H0 = H0 + a | 0;
            H1 = H1 + b | 0;
            H2 = H2 + c | 0;
            H3 = H3 + d | 0;
            H4 = H4 + e | 0;
            H5 = H5 + f | 0;
            H6 = H6 + g | 0;
            H7 = H7 + h | 0;
        }
        function _core_heap(offset) {
            offset = offset | 0;
            _core(HEAP[offset | 0] << 24 | HEAP[offset | 1] << 16 | HEAP[offset | 2] << 8 | HEAP[offset | 3], HEAP[offset | 4] << 24 | HEAP[offset | 5] << 16 | HEAP[offset | 6] << 8 | HEAP[offset | 7], HEAP[offset | 8] << 24 | HEAP[offset | 9] << 16 | HEAP[offset | 10] << 8 | HEAP[offset | 11], HEAP[offset | 12] << 24 | HEAP[offset | 13] << 16 | HEAP[offset | 14] << 8 | HEAP[offset | 15], HEAP[offset | 16] << 24 | HEAP[offset | 17] << 16 | HEAP[offset | 18] << 8 | HEAP[offset | 19], HEAP[offset | 20] << 24 | HEAP[offset | 21] << 16 | HEAP[offset | 22] << 8 | HEAP[offset | 23], HEAP[offset | 24] << 24 | HEAP[offset | 25] << 16 | HEAP[offset | 26] << 8 | HEAP[offset | 27], HEAP[offset | 28] << 24 | HEAP[offset | 29] << 16 | HEAP[offset | 30] << 8 | HEAP[offset | 31], HEAP[offset | 32] << 24 | HEAP[offset | 33] << 16 | HEAP[offset | 34] << 8 | HEAP[offset | 35], HEAP[offset | 36] << 24 | HEAP[offset | 37] << 16 | HEAP[offset | 38] << 8 | HEAP[offset | 39], HEAP[offset | 40] << 24 | HEAP[offset | 41] << 16 | HEAP[offset | 42] << 8 | HEAP[offset | 43], HEAP[offset | 44] << 24 | HEAP[offset | 45] << 16 | HEAP[offset | 46] << 8 | HEAP[offset | 47], HEAP[offset | 48] << 24 | HEAP[offset | 49] << 16 | HEAP[offset | 50] << 8 | HEAP[offset | 51], HEAP[offset | 52] << 24 | HEAP[offset | 53] << 16 | HEAP[offset | 54] << 8 | HEAP[offset | 55], HEAP[offset | 56] << 24 | HEAP[offset | 57] << 16 | HEAP[offset | 58] << 8 | HEAP[offset | 59], HEAP[offset | 60] << 24 | HEAP[offset | 61] << 16 | HEAP[offset | 62] << 8 | HEAP[offset | 63]);
        }
        function _state_to_heap(output) {
            output = output | 0;
            HEAP[output | 0] = H0 >>> 24;
            HEAP[output | 1] = H0 >>> 16 & 255;
            HEAP[output | 2] = H0 >>> 8 & 255;
            HEAP[output | 3] = H0 & 255;
            HEAP[output | 4] = H1 >>> 24;
            HEAP[output | 5] = H1 >>> 16 & 255;
            HEAP[output | 6] = H1 >>> 8 & 255;
            HEAP[output | 7] = H1 & 255;
            HEAP[output | 8] = H2 >>> 24;
            HEAP[output | 9] = H2 >>> 16 & 255;
            HEAP[output | 10] = H2 >>> 8 & 255;
            HEAP[output | 11] = H2 & 255;
            HEAP[output | 12] = H3 >>> 24;
            HEAP[output | 13] = H3 >>> 16 & 255;
            HEAP[output | 14] = H3 >>> 8 & 255;
            HEAP[output | 15] = H3 & 255;
            HEAP[output | 16] = H4 >>> 24;
            HEAP[output | 17] = H4 >>> 16 & 255;
            HEAP[output | 18] = H4 >>> 8 & 255;
            HEAP[output | 19] = H4 & 255;
            HEAP[output | 20] = H5 >>> 24;
            HEAP[output | 21] = H5 >>> 16 & 255;
            HEAP[output | 22] = H5 >>> 8 & 255;
            HEAP[output | 23] = H5 & 255;
            HEAP[output | 24] = H6 >>> 24;
            HEAP[output | 25] = H6 >>> 16 & 255;
            HEAP[output | 26] = H6 >>> 8 & 255;
            HEAP[output | 27] = H6 & 255;
            HEAP[output | 28] = H7 >>> 24;
            HEAP[output | 29] = H7 >>> 16 & 255;
            HEAP[output | 30] = H7 >>> 8 & 255;
            HEAP[output | 31] = H7 & 255;
        }
        function reset() {
            H0 = 1779033703;
            H1 = 3144134277;
            H2 = 1013904242;
            H3 = 2773480762;
            H4 = 1359893119;
            H5 = 2600822924;
            H6 = 528734635;
            H7 = 1541459225;
            TOTAL = 0;
        }
        function init(h0, h1, h2, h3, h4, h5, h6, h7, total) {
            h0 = h0 | 0;
            h1 = h1 | 0;
            h2 = h2 | 0;
            h3 = h3 | 0;
            h4 = h4 | 0;
            h5 = h5 | 0;
            h6 = h6 | 0;
            h7 = h7 | 0;
            total = total | 0;
            H0 = h0;
            H1 = h1;
            H2 = h2;
            H3 = h3;
            H4 = h4;
            H5 = h5;
            H6 = h6;
            H7 = h7;
            TOTAL = total;
        }
        function process(offset, length) {
            offset = offset | 0;
            length = length | 0;
            var hashed = 0;
            if (offset & 63) return -1;
            while ((length | 0) >= 64) {
                _core_heap(offset);
                offset = offset + 64 | 0;
                length = length - 64 | 0;
                hashed = hashed + 64 | 0;
            }
            TOTAL = TOTAL + hashed | 0;
            return hashed | 0;
        }
        function finish(offset, length, output) {
            offset = offset | 0;
            length = length | 0;
            output = output | 0;
            var hashed = 0, i = 0;
            if (offset & 63) return -1;
            if (~output) if (output & 31) return -1;
            if ((length | 0) >= 64) {
                hashed = process(offset, length) | 0;
                if ((hashed | 0) == -1) return -1;
                offset = offset + hashed | 0;
                length = length - hashed | 0;
            }
            hashed = hashed + length | 0;
            TOTAL = TOTAL + length | 0;
            HEAP[offset | length] = 128;
            if ((length | 0) >= 56) {
                for (i = length + 1 | 0; (i | 0) < 64; i = i + 1 | 0) HEAP[offset | i] = 0;
                _core_heap(offset);
                length = 0;
                HEAP[offset | 0] = 0;
            }
            for (i = length + 1 | 0; (i | 0) < 59; i = i + 1 | 0) HEAP[offset | i] = 0;
            HEAP[offset | 59] = TOTAL >>> 29;
            HEAP[offset | 60] = TOTAL >>> 21 & 255;
            HEAP[offset | 61] = TOTAL >>> 13 & 255;
            HEAP[offset | 62] = TOTAL >>> 5 & 255;
            HEAP[offset | 63] = TOTAL << 3 & 255;
            _core_heap(offset);
            if (~output) _state_to_heap(output);
            return hashed | 0;
        }
        function hmac_reset() {
            H0 = I0;
            H1 = I1;
            H2 = I2;
            H3 = I3;
            H4 = I4;
            H5 = I5;
            H6 = I6;
            H7 = I7;
            TOTAL = 64;
        }
        function _hmac_opad() {
            H0 = O0;
            H1 = O1;
            H2 = O2;
            H3 = O3;
            H4 = O4;
            H5 = O5;
            H6 = O6;
            H7 = O7;
            TOTAL = 64;
        }
        function hmac_init(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15) {
            p0 = p0 | 0;
            p1 = p1 | 0;
            p2 = p2 | 0;
            p3 = p3 | 0;
            p4 = p4 | 0;
            p5 = p5 | 0;
            p6 = p6 | 0;
            p7 = p7 | 0;
            p8 = p8 | 0;
            p9 = p9 | 0;
            p10 = p10 | 0;
            p11 = p11 | 0;
            p12 = p12 | 0;
            p13 = p13 | 0;
            p14 = p14 | 0;
            p15 = p15 | 0;
            reset();
            _core(p0 ^ 1549556828, p1 ^ 1549556828, p2 ^ 1549556828, p3 ^ 1549556828, p4 ^ 1549556828, p5 ^ 1549556828, p6 ^ 1549556828, p7 ^ 1549556828, p8 ^ 1549556828, p9 ^ 1549556828, p10 ^ 1549556828, p11 ^ 1549556828, p12 ^ 1549556828, p13 ^ 1549556828, p14 ^ 1549556828, p15 ^ 1549556828);
            O0 = H0;
            O1 = H1;
            O2 = H2;
            O3 = H3;
            O4 = H4;
            O5 = H5;
            O6 = H6;
            O7 = H7;
            reset();
            _core(p0 ^ 909522486, p1 ^ 909522486, p2 ^ 909522486, p3 ^ 909522486, p4 ^ 909522486, p5 ^ 909522486, p6 ^ 909522486, p7 ^ 909522486, p8 ^ 909522486, p9 ^ 909522486, p10 ^ 909522486, p11 ^ 909522486, p12 ^ 909522486, p13 ^ 909522486, p14 ^ 909522486, p15 ^ 909522486);
            I0 = H0;
            I1 = H1;
            I2 = H2;
            I3 = H3;
            I4 = H4;
            I5 = H5;
            I6 = H6;
            I7 = H7;
            TOTAL = 64;
        }
        function hmac_finish(offset, length, output) {
            offset = offset | 0;
            length = length | 0;
            output = output | 0;
            var t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, hashed = 0;
            if (offset & 63) return -1;
            if (~output) if (output & 31) return -1;
            hashed = finish(offset, length, -1) | 0;
            t0 = H0, t1 = H1, t2 = H2, t3 = H3, t4 = H4, t5 = H5, t6 = H6, t7 = H7;
            _hmac_opad();
            _core(t0, t1, t2, t3, t4, t5, t6, t7, 2147483648, 0, 0, 0, 0, 0, 0, 768);
            if (~output) _state_to_heap(output);
            return hashed | 0;
        }
        function pbkdf2_generate_block(offset, length, block, count, output) {
            offset = offset | 0;
            length = length | 0;
            block = block | 0;
            count = count | 0;
            output = output | 0;
            var h0 = 0, h1 = 0, h2 = 0, h3 = 0, h4 = 0, h5 = 0, h6 = 0, h7 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0;
            if (offset & 63) return -1;
            if (~output) if (output & 31) return -1;
            HEAP[offset + length | 0] = block >>> 24;
            HEAP[offset + length + 1 | 0] = block >>> 16 & 255;
            HEAP[offset + length + 2 | 0] = block >>> 8 & 255;
            HEAP[offset + length + 3 | 0] = block & 255;
            hmac_finish(offset, length + 4 | 0, -1) | 0;
            h0 = t0 = H0, h1 = t1 = H1, h2 = t2 = H2, h3 = t3 = H3, h4 = t4 = H4, h5 = t5 = H5, 
            h6 = t6 = H6, h7 = t7 = H7;
            count = count - 1 | 0;
            while ((count | 0) > 0) {
                hmac_reset();
                _core(t0, t1, t2, t3, t4, t5, t6, t7, 2147483648, 0, 0, 0, 0, 0, 0, 768);
                t0 = H0, t1 = H1, t2 = H2, t3 = H3, t4 = H4, t5 = H5, t6 = H6, t7 = H7;
                _hmac_opad();
                _core(t0, t1, t2, t3, t4, t5, t6, t7, 2147483648, 0, 0, 0, 0, 0, 0, 768);
                t0 = H0, t1 = H1, t2 = H2, t3 = H3, t4 = H4, t5 = H5, t6 = H6, t7 = H7;
                h0 = h0 ^ H0;
                h1 = h1 ^ H1;
                h2 = h2 ^ H2;
                h3 = h3 ^ H3;
                h4 = h4 ^ H4;
                h5 = h5 ^ H5;
                h6 = h6 ^ H6;
                h7 = h7 ^ H7;
                count = count - 1 | 0;
            }
            H0 = h0;
            H1 = h1;
            H2 = h2;
            H3 = h3;
            H4 = h4;
            H5 = h5;
            H6 = h6;
            H7 = h7;
            if (~output) _state_to_heap(output);
            return 0;
        }
        return {
            reset: reset,
            init: init,
            process: process,
            finish: finish,
            hmac_reset: hmac_reset,
            hmac_init: hmac_init,
            hmac_finish: hmac_finish,
            pbkdf2_generate_block: pbkdf2_generate_block
        };
    }
    var _sha256_block_size = 64, _sha256_hash_size = 32;
    function sha256_constructor(options) {
        options = options || {};
        options.heapSize = options.heapSize || 4096;
        if (options.heapSize <= 0 || options.heapSize % 4096) throw new IllegalArgumentError("heapSize must be a positive number and multiple of 4096");
        this.heap = options.heap || new Uint8Array(options.heapSize);
        this.asm = options.asm || sha256_asm(global, null, this.heap.buffer);
        this.BLOCK_SIZE = _sha256_block_size;
        this.HASH_SIZE = _sha256_hash_size;
        this.reset();
    }
    function sha256_reset() {
        this.result = null;
        this.pos = 0;
        this.len = 0;
        this.asm.reset();
        return this;
    }
    function sha256_process(data) {
        if (this.result !== null) throw new IllegalStateError("state must be reset before processing new data");
        var dpos = 0, dlen = 0, clen = 0;
        if (is_buffer(data) || is_bytes(data)) {
            dpos = data.byteOffset || 0;
            dlen = data.byteLength;
        } else if (is_string(data)) {
            dlen = data.length;
        } else {
            throw new TypeError("data isn't of expected type");
        }
        while (dlen > 0) {
            clen = this.heap.byteLength - this.pos - this.len;
            clen = clen < dlen ? clen : dlen;
            if (is_buffer(data) || is_bytes(data)) {
                this.heap.set(new Uint8Array(data.buffer || data, dpos, clen), this.pos + this.len);
            } else {
                for (var i = 0; i < clen; i++) this.heap[this.pos + this.len + i] = data.charCodeAt(dpos + i);
            }
            this.len += clen;
            dpos += clen;
            dlen -= clen;
            clen = this.asm.process(this.pos, this.len);
            if (clen < this.len) {
                this.pos += clen;
                this.len -= clen;
            } else {
                this.pos = 0;
                this.len = 0;
            }
        }
        return this;
    }
    function sha256_finish() {
        if (this.result !== null) throw new IllegalStateError("state must be reset before processing new data");
        this.asm.finish(this.pos, this.len, 0);
        this.result = new Uint8Array(_sha256_hash_size);
        this.result.set(this.heap.subarray(0, _sha256_hash_size));
        this.pos = 0;
        this.len = 0;
        return this;
    }
    sha256_constructor.BLOCK_SIZE = _sha256_block_size;
    sha256_constructor.HASH_SIZE = _sha256_hash_size;
    var sha256_prototype = sha256_constructor.prototype;
    sha256_prototype.reset = sha256_reset;
    sha256_prototype.process = sha256_process;
    sha256_prototype.finish = sha256_finish;
    function hmac_constructor(options) {
        options = options || {};
        if (!options.hash) throw new SyntaxError("option 'hash' is required");
        if (!options.hash.HASH_SIZE) throw new SyntaxError("option 'hash' supplied doesn't seem to be a valid hash function");
        this.hash = options.hash;
        this.BLOCK_SIZE = this.hash.BLOCK_SIZE;
        this.HMAC_SIZE = this.hash.HASH_SIZE;
        this.key = null;
        this.verify = null;
        this.result = null;
        if (options.password !== undefined || options.verify !== undefined) this.reset(options);
        return this;
    }
    function hmac_sha256_constructor(options) {
        options = options || {};
        if (!(options.hash instanceof sha256_constructor)) options.hash = new sha256_constructor(options);
        hmac_constructor.call(this, options);
        return this;
    }
    function _hmac_key(hash, password) {
        var key;
        if (is_buffer(password) || is_bytes(password)) {
            key = new Uint8Array(hash.BLOCK_SIZE);
            if (password.byteLength > this.hash.BLOCK_SIZE) {
                key.set(new Uint8Array(hash.reset().process(password).finish().result));
            } else if (is_buffer(password)) {
                key.set(new Uint8Array(password));
            } else {
                key.set(password);
            }
        } else if (is_string(password)) {
            key = new Uint8Array(hash.BLOCK_SIZE);
            if (password.length > hash.BLOCK_SIZE) {
                key.set(new Uint8Array(hash.reset().process(password).finish().result));
            } else {
                for (var i = 0; i < password.length; ++i) key[i] = password.charCodeAt(i);
            }
        } else {
            throw new TypeError("password isn't of expected type");
        }
        return key;
    }
    function _hmac_init_verify(verify) {
        if (is_buffer(verify) || is_bytes(verify)) {
            verify = new Uint8Array(verify);
        } else if (is_string(verify)) {
            verify = string_to_bytes(verify);
        } else {
            throw new TypeError("verify tag isn't of expected type");
        }
        if (verify.length !== this.HMAC_SIZE) throw new IllegalArgumentError("illegal verification tag size");
        this.verify = verify;
    }
    function hmac_reset(options) {
        options = options || {};
        var password = options.password;
        if (this.key === null && !is_string(password) && !password) throw new IllegalStateError("no key is associated with the instance");
        this.result = null;
        this.hash.reset();
        if (password || is_string(password)) this.key = _hmac_key(this.hash, password);
        var ipad = new Uint8Array(this.key);
        for (var i = 0; i < ipad.length; ++i) ipad[i] ^= 54;
        this.hash.process(ipad);
        var verify = options.verify;
        if (verify !== undefined) {
            _hmac_init_verify.call(this, verify);
        } else {
            this.verify = null;
        }
        return this;
    }
    function hmac_sha256_reset(options) {
        options = options || {};
        var password = options.password;
        if (this.key === null && !is_string(password) && !password) throw new IllegalStateError("no key is associated with the instance");
        this.result = null;
        this.hash.reset();
        if (password || is_string(password)) {
            this.key = _hmac_key(this.hash, password);
            this.hash.reset().asm.hmac_init(this.key[0] << 24 | this.key[1] << 16 | this.key[2] << 8 | this.key[3], this.key[4] << 24 | this.key[5] << 16 | this.key[6] << 8 | this.key[7], this.key[8] << 24 | this.key[9] << 16 | this.key[10] << 8 | this.key[11], this.key[12] << 24 | this.key[13] << 16 | this.key[14] << 8 | this.key[15], this.key[16] << 24 | this.key[17] << 16 | this.key[18] << 8 | this.key[19], this.key[20] << 24 | this.key[21] << 16 | this.key[22] << 8 | this.key[23], this.key[24] << 24 | this.key[25] << 16 | this.key[26] << 8 | this.key[27], this.key[28] << 24 | this.key[29] << 16 | this.key[30] << 8 | this.key[31], this.key[32] << 24 | this.key[33] << 16 | this.key[34] << 8 | this.key[35], this.key[36] << 24 | this.key[37] << 16 | this.key[38] << 8 | this.key[39], this.key[40] << 24 | this.key[41] << 16 | this.key[42] << 8 | this.key[43], this.key[44] << 24 | this.key[45] << 16 | this.key[46] << 8 | this.key[47], this.key[48] << 24 | this.key[49] << 16 | this.key[50] << 8 | this.key[51], this.key[52] << 24 | this.key[53] << 16 | this.key[54] << 8 | this.key[55], this.key[56] << 24 | this.key[57] << 16 | this.key[58] << 8 | this.key[59], this.key[60] << 24 | this.key[61] << 16 | this.key[62] << 8 | this.key[63]);
        } else {
            this.hash.asm.hmac_reset();
        }
        var verify = options.verify;
        if (verify !== undefined) {
            _hmac_init_verify.call(this, verify);
        } else {
            this.verify = null;
        }
        return this;
    }
    function hmac_process(data) {
        if (this.key === null) throw new IllegalStateError("no key is associated with the instance");
        if (this.result !== null) throw new IllegalStateError("state must be reset before processing new data");
        this.hash.process(data);
        return this;
    }
    function hmac_finish() {
        if (this.key === null) throw new IllegalStateError("no key is associated with the instance");
        if (this.result !== null) throw new IllegalStateError("state must be reset before processing new data");
        var inner_result = this.hash.finish().result;
        var opad = new Uint8Array(this.key);
        for (var i = 0; i < opad.length; ++i) opad[i] ^= 92;
        var verify = this.verify;
        var result = this.hash.reset().process(opad).process(inner_result).finish().result;
        if (verify) {
            if (verify.length === result.length) {
                var diff = 0;
                for (var i = 0; i < verify.length; i++) {
                    diff |= verify[i] ^ result[i];
                }
                this.result = !diff;
            } else {
                this.result = false;
            }
        } else {
            this.result = result;
        }
        return this;
    }
    function hmac_sha256_finish() {
        if (this.key === null) throw new IllegalStateError("no key is associated with the instance");
        if (this.result !== null) throw new IllegalStateError("state must be reset before processing new data");
        var hash = this.hash, asm = this.hash.asm, heap = this.hash.heap;
        asm.hmac_finish(hash.pos, hash.len, 0);
        var verify = this.verify;
        var result = new Uint8Array(_sha256_hash_size);
        result.set(heap.subarray(0, _sha256_hash_size));
        if (verify) {
            if (verify.length === result.length) {
                var diff = 0;
                for (var i = 0; i < verify.length; i++) {
                    diff |= verify[i] ^ result[i];
                }
                this.result = !diff;
            } else {
                this.result = false;
            }
        } else {
            this.result = result;
        }
        return this;
    }
    var hmac_prototype = hmac_constructor.prototype;
    hmac_prototype.reset = hmac_reset;
    hmac_prototype.process = hmac_process;
    hmac_prototype.finish = hmac_finish;
    hmac_sha256_constructor.BLOCK_SIZE = sha256_constructor.BLOCK_SIZE;
    hmac_sha256_constructor.HMAC_SIZE = sha256_constructor.HASH_SIZE;
    var hmac_sha256_prototype = hmac_sha256_constructor.prototype;
    hmac_sha256_prototype.reset = hmac_sha256_reset;
    hmac_sha256_prototype.process = hmac_process;
    hmac_sha256_prototype.finish = hmac_sha256_finish;
    function pbkdf2_constructor(options) {
        options = options || {};
        if (!options.hmac) throw new SyntaxError("option 'hmac' is required");
        if (!options.hmac.HMAC_SIZE) throw new SyntaxError("option 'hmac' supplied doesn't seem to be a valid HMAC function");
        this.hmac = options.hmac;
        this.count = options.count || 4096;
        this.length = options.length || this.hmac.HMAC_SIZE;
        this.result = null;
        var password = options.password;
        if (password || is_string(password)) this.reset(options);
        return this;
    }
    function pbkdf2_hmac_sha256_constructor(options) {
        options = options || {};
        if (!(options.hmac instanceof hmac_sha256_constructor)) options.hmac = new hmac_sha256_constructor(options);
        pbkdf2_constructor.call(this, options);
        return this;
    }
    function pbkdf2_reset(options) {
        this.result = null;
        this.hmac.reset(options);
        return this;
    }
    function pbkdf2_generate(salt, count, length) {
        if (this.result !== null) throw new IllegalStateError("state must be reset before processing new data");
        if (!salt && !is_string(salt)) throw new IllegalArgumentError("bad 'salt' value");
        count = count || this.count;
        length = length || this.length;
        this.result = new Uint8Array(length);
        var blocks = Math.ceil(length / this.hmac.HMAC_SIZE);
        for (var i = 1; i <= blocks; ++i) {
            var j = (i - 1) * this.hmac.HMAC_SIZE;
            var l = (i < blocks ? 0 : length % this.hmac.HMAC_SIZE) || this.hmac.HMAC_SIZE;
            var tmp = new Uint8Array(this.hmac.reset().process(salt).process(new Uint8Array([ i >>> 24 & 255, i >>> 16 & 255, i >>> 8 & 255, i & 255 ])).finish().result);
            this.result.set(tmp.subarray(0, l), j);
            for (var k = 1; k < count; ++k) {
                tmp = new Uint8Array(this.hmac.reset().process(tmp).finish().result);
                for (var r = 0; r < l; ++r) this.result[j + r] ^= tmp[r];
            }
        }
        return this;
    }
    function pbkdf2_hmac_sha256_generate(salt, count, length) {
        if (this.result !== null) throw new IllegalStateError("state must be reset before processing new data");
        if (!salt && !is_string(salt)) throw new IllegalArgumentError("bad 'salt' value");
        count = count || this.count;
        length = length || this.length;
        this.result = new Uint8Array(length);
        var blocks = Math.ceil(length / this.hmac.HMAC_SIZE);
        for (var i = 1; i <= blocks; ++i) {
            var j = (i - 1) * this.hmac.HMAC_SIZE;
            var l = (i < blocks ? 0 : length % this.hmac.HMAC_SIZE) || this.hmac.HMAC_SIZE;
            this.hmac.reset().process(salt);
            this.hmac.hash.asm.pbkdf2_generate_block(this.hmac.hash.pos, this.hmac.hash.len, i, count, 0);
            this.result.set(this.hmac.hash.heap.subarray(0, l), j);
        }
        return this;
    }
    var pbkdf2_prototype = pbkdf2_constructor.prototype;
    pbkdf2_prototype.reset = pbkdf2_reset;
    pbkdf2_prototype.generate = pbkdf2_generate;
    var pbkdf2_hmac_sha256_prototype = pbkdf2_hmac_sha256_constructor.prototype;
    pbkdf2_hmac_sha256_prototype.reset = pbkdf2_reset;
    pbkdf2_hmac_sha256_prototype.generate = pbkdf2_hmac_sha256_generate;
    global.IllegalStateError = IllegalStateError;
    global.IllegalArgumentError = IllegalArgumentError;
    global.SecurityError = SecurityError;
    exports.string_to_bytes = string_to_bytes;
    exports.hex_to_bytes = hex_to_bytes;
    exports.base64_to_bytes = base64_to_bytes;
    exports.bytes_to_string = bytes_to_string;
    exports.bytes_to_hex = bytes_to_hex;
    exports.bytes_to_base64 = bytes_to_base64;
    var SHA256_instance = new sha256_constructor({
        heapSize: 1048576
    });
    function sha256_bytes(data) {
        if (data === undefined) throw new SyntaxError("data required");
        return SHA256_instance.reset().process(data).finish().result;
    }
    function sha256_hex(data) {
        var result = sha256_bytes(data);
        return bytes_to_hex(result);
    }
    function sha256_base64(data) {
        var result = sha256_bytes(data);
        return bytes_to_base64(result);
    }
    exports.SHA256 = {
        bytes: sha256_bytes,
        hex: sha256_hex,
        base64: sha256_base64
    };
    var hmac_sha256_instance = new hmac_sha256_constructor({
        hash: SHA256_instance
    });
    function hmac_sha256_bytes(data, password) {
        if (data === undefined) throw new SyntaxError("data required");
        if (password === undefined) throw new SyntaxError("password required");
        return hmac_sha256_instance.reset({
            password: password
        }).process(data).finish().result;
    }
    function hmac_sha256_hex(data, password) {
        var result = hmac_sha256_bytes(data, password);
        return bytes_to_hex(result);
    }
    function hmac_sha256_base64(data, password) {
        var result = hmac_sha256_bytes(data, password);
        return bytes_to_base64(result);
    }
    exports.HMAC = exports.HMAC_SHA256 = {
        bytes: hmac_sha256_bytes,
        hex: hmac_sha256_hex,
        base64: hmac_sha256_base64
    };
    var pbkdf2_hmac_sha256_instance = new pbkdf2_hmac_sha256_constructor({
        hmac: hmac_sha256_instance
    });
    function pbkdf2_hmac_sha256_bytes(password, salt, iterations, dklen) {
        if (password === undefined) throw new SyntaxError("password required");
        if (salt === undefined) throw new SyntaxError("salt required");
        return pbkdf2_hmac_sha256_instance.reset({
            password: password
        }).generate(salt, iterations, dklen).result;
    }
    function pbkdf2_hmac_sha256_hex(password, salt, iterations, dklen) {
        var result = pbkdf2_hmac_sha256_bytes(password, salt, iterations, dklen);
        return bytes_to_hex(result);
    }
    function pbkdf2_hmac_sha256_base64(password, salt, iterations, dklen) {
        var result = pbkdf2_hmac_sha256_bytes(password, salt, iterations, dklen);
        return bytes_to_base64(result);
    }
    exports.PBKDF2 = exports.PBKDF2_HMAC_SHA256 = {
        bytes: pbkdf2_hmac_sha256_bytes,
        hex: pbkdf2_hmac_sha256_hex,
        base64: pbkdf2_hmac_sha256_base64
    };
    var cbc_aes_instance = new cbc_aes_constructor({
        heapSize: 1048576
    });
    function cbc_aes_encrypt_bytes(data, key, padding, iv) {
        if (data === undefined) throw new SyntaxError("data required");
        if (key === undefined) throw new SyntaxError("key required");
        return cbc_aes_instance.reset({
            key: key,
            padding: padding,
            iv: iv
        }).encrypt(data).result;
    }
    function cbc_aes_decrypt_bytes(data, key, padding, iv) {
        if (data === undefined) throw new SyntaxError("data required");
        if (key === undefined) throw new SyntaxError("key required");
        return cbc_aes_instance.reset({
            key: key,
            padding: padding,
            iv: iv
        }).decrypt(data).result;
    }
    exports.AES = exports.AES_CBC = {
        encrypt: cbc_aes_encrypt_bytes,
        decrypt: cbc_aes_decrypt_bytes
    };
    var ccm_aes_instance = new ccm_aes_constructor({
        heap: cbc_aes_instance.heap,
        asm: cbc_aes_instance.asm
    });
    function ccm_aes_encrypt_bytes(data, key, nonce, adata, tagSize) {
        if (data === undefined) throw new SyntaxError("data required");
        if (key === undefined) throw new SyntaxError("key required");
        if (nonce === undefined) throw new SyntaxError("nonce required");
        var dataLength = data.byteLength || data.length || 0;
        return ccm_aes_instance.reset({
            key: key,
            nonce: nonce,
            adata: adata,
            tagSize: tagSize,
            dataLength: dataLength
        }).encrypt(data).result;
    }
    function ccm_aes_decrypt_bytes(data, key, nonce, adata, tagSize) {
        if (data === undefined) throw new SyntaxError("data required");
        if (key === undefined) throw new SyntaxError("key required");
        if (nonce === undefined) throw new SyntaxError("nonce required");
        var dataLength = data.byteLength || data.length || 0;
        tagSize = tagSize || _aes_block_size;
        return ccm_aes_instance.reset({
            key: key,
            nonce: nonce,
            adata: adata,
            tagSize: tagSize,
            dataLength: dataLength - tagSize
        }).decrypt(data).result;
    }
    exports.AES_CCM = {
        encrypt: ccm_aes_encrypt_bytes,
        decrypt: ccm_aes_decrypt_bytes
    };
    function Random_getBytes(buffer) {
        if (!is_buffer(buffer) && !is_bytes(buffer)) throw new TypeError("unexpected buffer type");
        var bytes = new Uint8Array(buffer.buffer || buffer, buffer.byteOffset || 0, buffer.byteLength || buffer.length);
        global.crypto.getRandomValues(bytes);
        return bytes;
    }
    if (global.Math.imul === undefined) {
        global.Math.imul = function imul_polyfill(a, b) {
            return (a >>> 0) * (b >>> 0) | 0;
        };
    }
    function bigint_asm(stdlib, foreign, buffer) {
        "use asm";
        var SP = 0;
        var HEAP32 = new stdlib.Uint32Array(buffer);
        var imul = stdlib.Math.imul;
        function sreset(p) {
            p = p | 0;
            SP = p = p + 31 & -32;
            return p | 0;
        }
        function salloc(l) {
            l = l | 0;
            var p = 0;
            p = SP;
            SP = p + (l + 31 & -32) | 0;
            return p | 0;
        }
        function sfree(l) {
            l = l | 0;
            SP = SP - (l + 31 & -32) | 0;
        }
        function cp(l, A, B) {
            l = l | 0;
            A = A | 0;
            B = B | 0;
            var i = 0;
            if ((A | 0) > (B | 0)) {
                for (;(i | 0) < (l | 0); i = i + 4 | 0) {
                    HEAP32[B + i >> 2] = HEAP32[A + i >> 2];
                }
            } else {
                for (i = l - 4 | 0; (i | 0) >= 0; i = i - 4 | 0) {
                    HEAP32[B + i >> 2] = HEAP32[A + i >> 2];
                }
            }
        }
        function z(l, z, A) {
            l = l | 0;
            z = z | 0;
            A = A | 0;
            var i = 0;
            for (;(i | 0) < (l | 0); i = i + 4 | 0) {
                HEAP32[A + i >> 2] = z;
            }
        }
        function neg(A, lA, R, lR) {
            A = A | 0;
            lA = lA | 0;
            R = R | 0;
            lR = lR | 0;
            var a = 0, c = 0, t = 0, r = 0, i = 0;
            if ((lR | 0) <= 0) lR = lA;
            if ((lR | 0) < (lA | 0)) lA = lR;
            c = 1;
            for (;(i | 0) < (lA | 0); i = i + 4 | 0) {
                a = ~HEAP32[A + i >> 2];
                t = (a & 65535) + c | 0;
                r = (a >>> 16) + (t >>> 16) | 0;
                HEAP32[R + i >> 2] = r << 16 | t & 65535;
                c = r >>> 16;
            }
            for (;(i | 0) < (lR | 0); i = i + 4 | 0) {
                HEAP32[R + i >> 2] = c - 1 | 0;
            }
            return c | 0;
        }
        function cmp(A, lA, B, lB) {
            A = A | 0;
            lA = lA | 0;
            B = B | 0;
            lB = lB | 0;
            var a = 0, b = 0, i = 0;
            if ((lA | 0) > (lB | 0)) {
                for (i = lA - 4 | 0; (i | 0) >= (lB | 0); i = i - 4 | 0) {
                    if (HEAP32[A + i >> 2] | 0) return 1;
                }
            } else {
                for (i = lB - 4 | 0; (i | 0) >= (lA | 0); i = i - 4 | 0) {
                    if (HEAP32[B + i >> 2] | 0) return -1;
                }
            }
            for (;(i | 0) >= 0; i = i - 4 | 0) {
                a = HEAP32[A + i >> 2] >>> 0, b = HEAP32[B + i >> 2] >>> 0;
                if (a >>> 0 < b >>> 0) return -1;
                if (a >>> 0 > b >>> 0) return 1;
            }
            return 0;
        }
        function tst(A, lA) {
            A = A | 0;
            lA = lA | 0;
            var i = 0;
            for (i = lA - 4 | 0; (i | 0) >= 0; i = i - 4 | 0) {
                if (HEAP32[A + i >> 2] | 0) return i + 4 | 0;
            }
            return 0;
        }
        function add(A, lA, B, lB, R, lR) {
            A = A | 0;
            lA = lA | 0;
            B = B | 0;
            lB = lB | 0;
            R = R | 0;
            lR = lR | 0;
            var a = 0, b = 0, c = 0, t = 0, r = 0, i = 0;
            if ((lA | 0) < (lB | 0)) {
                t = A, A = B, B = t;
                t = lA, lA = lB, lB = t;
            }
            if ((lR | 0) <= 0) lR = lA + 4 | 0;
            if ((lR | 0) < (lB | 0)) lA = lB = lR;
            for (;(i | 0) < (lB | 0); i = i + 4 | 0) {
                a = HEAP32[A + i >> 2] | 0;
                b = HEAP32[B + i >> 2] | 0;
                t = ((a & 65535) + (b & 65535) | 0) + c | 0;
                r = ((a >>> 16) + (b >>> 16) | 0) + (t >>> 16) | 0;
                HEAP32[R + i >> 2] = t & 65535 | r << 16;
                c = r >>> 16;
            }
            for (;(i | 0) < (lA | 0); i = i + 4 | 0) {
                a = HEAP32[A + i >> 2] | 0;
                t = (a & 65535) + c | 0;
                r = (a >>> 16) + (t >>> 16) | 0;
                HEAP32[R + i >> 2] = t & 65535 | r << 16;
                c = r >>> 16;
            }
            for (;(i | 0) < (lR | 0); i = i + 4 | 0) {
                HEAP32[R + i >> 2] = c | 0;
                c = 0;
            }
            return c | 0;
        }
        function sub(A, lA, B, lB, R, lR) {
            A = A | 0;
            lA = lA | 0;
            B = B | 0;
            lB = lB | 0;
            R = R | 0;
            lR = lR | 0;
            var a = 0, b = 0, c = 0, t = 0, r = 0, i = 0;
            if ((lR | 0) <= 0) lR = (lA | 0) > (lB | 0) ? lA + 4 | 0 : lB + 4 | 0;
            if ((lR | 0) < (lA | 0)) lA = lR;
            if ((lR | 0) < (lB | 0)) lB = lR;
            if ((lA | 0) < (lB | 0)) {
                for (;(i | 0) < (lA | 0); i = i + 4 | 0) {
                    a = HEAP32[A + i >> 2] | 0;
                    b = HEAP32[B + i >> 2] | 0;
                    t = ((a & 65535) - (b & 65535) | 0) + c | 0;
                    r = ((a >>> 16) - (b >>> 16) | 0) + (t >> 16) | 0;
                    HEAP32[R + i >> 2] = t & 65535 | r << 16;
                    c = r >> 16;
                }
                for (;(i | 0) < (lB | 0); i = i + 4 | 0) {
                    b = HEAP32[B + i >> 2] | 0;
                    t = c - (b & 65535) | 0;
                    r = (t >> 16) - (b >>> 16) | 0;
                    HEAP32[R + i >> 2] = t & 65535 | r << 16;
                    c = r >> 16;
                }
            } else {
                for (;(i | 0) < (lB | 0); i = i + 4 | 0) {
                    a = HEAP32[A + i >> 2] | 0;
                    b = HEAP32[B + i >> 2] | 0;
                    t = ((a & 65535) - (b & 65535) | 0) + c | 0;
                    r = ((a >>> 16) - (b >>> 16) | 0) + (t >> 16) | 0;
                    HEAP32[R + i >> 2] = t & 65535 | r << 16;
                    c = r >> 16;
                }
                for (;(i | 0) < (lA | 0); i = i + 4 | 0) {
                    a = HEAP32[A + i >> 2] | 0;
                    t = (a & 65535) + c | 0;
                    r = (a >>> 16) + (t >> 16) | 0;
                    HEAP32[R + i >> 2] = t & 65535 | r << 16;
                    c = r >> 16;
                }
            }
            for (;(i | 0) < (lR | 0); i = i + 4 | 0) {
                HEAP32[R + i >> 2] = c | 0;
            }
            return c | 0;
        }
        function mul(A, lA, B, lB, R, lR) {
            A = A | 0;
            lA = lA | 0;
            B = B | 0;
            lB = lB | 0;
            R = R | 0;
            lR = lR | 0;
            var al0 = 0, al1 = 0, al2 = 0, al3 = 0, al4 = 0, al5 = 0, al6 = 0, al7 = 0, ah0 = 0, ah1 = 0, ah2 = 0, ah3 = 0, ah4 = 0, ah5 = 0, ah6 = 0, ah7 = 0, bl0 = 0, bl1 = 0, bl2 = 0, bl3 = 0, bl4 = 0, bl5 = 0, bl6 = 0, bl7 = 0, bh0 = 0, bh1 = 0, bh2 = 0, bh3 = 0, bh4 = 0, bh5 = 0, bh6 = 0, bh7 = 0, r0 = 0, r1 = 0, r2 = 0, r3 = 0, r4 = 0, r5 = 0, r6 = 0, r7 = 0, r8 = 0, r9 = 0, r10 = 0, r11 = 0, r12 = 0, r13 = 0, r14 = 0, r15 = 0, u = 0, v = 0, w = 0, m = 0, i = 0, Ai = 0, j = 0, Bj = 0, Rk = 0;
            if ((lA | 0) > (lB | 0)) {
                u = A, v = lA;
                A = B, lA = lB;
                B = u, lB = v;
            }
            m = lA + lB | 0;
            if ((lR | 0) > (m | 0) | (lR | 0) <= 0) lR = m;
            if ((lR | 0) < (lA | 0)) lA = lR;
            if ((lR | 0) < (lB | 0)) lB = lR;
            for (;(i | 0) < (lA | 0); i = i + 32 | 0) {
                Ai = A + i | 0;
                ah0 = HEAP32[(Ai | 0) >> 2] | 0, ah1 = HEAP32[(Ai | 4) >> 2] | 0, ah2 = HEAP32[(Ai | 8) >> 2] | 0, 
                ah3 = HEAP32[(Ai | 12) >> 2] | 0, ah4 = HEAP32[(Ai | 16) >> 2] | 0, ah5 = HEAP32[(Ai | 20) >> 2] | 0, 
                ah6 = HEAP32[(Ai | 24) >> 2] | 0, ah7 = HEAP32[(Ai | 28) >> 2] | 0, al0 = ah0 & 65535, 
                al1 = ah1 & 65535, al2 = ah2 & 65535, al3 = ah3 & 65535, al4 = ah4 & 65535, al5 = ah5 & 65535, 
                al6 = ah6 & 65535, al7 = ah7 & 65535, ah0 = ah0 >>> 16, ah1 = ah1 >>> 16, ah2 = ah2 >>> 16, 
                ah3 = ah3 >>> 16, ah4 = ah4 >>> 16, ah5 = ah5 >>> 16, ah6 = ah6 >>> 16, ah7 = ah7 >>> 16;
                r8 = r9 = r10 = r11 = r12 = r13 = r14 = r15 = 0;
                for (j = 0; (j | 0) < (lB | 0); j = j + 32 | 0) {
                    Bj = B + j | 0;
                    Rk = R + (i + j | 0) | 0;
                    bh0 = HEAP32[(Bj | 0) >> 2] | 0, bh1 = HEAP32[(Bj | 4) >> 2] | 0, bh2 = HEAP32[(Bj | 8) >> 2] | 0, 
                    bh3 = HEAP32[(Bj | 12) >> 2] | 0, bh4 = HEAP32[(Bj | 16) >> 2] | 0, bh5 = HEAP32[(Bj | 20) >> 2] | 0, 
                    bh6 = HEAP32[(Bj | 24) >> 2] | 0, bh7 = HEAP32[(Bj | 28) >> 2] | 0, bl0 = bh0 & 65535, 
                    bl1 = bh1 & 65535, bl2 = bh2 & 65535, bl3 = bh3 & 65535, bl4 = bh4 & 65535, bl5 = bh5 & 65535, 
                    bl6 = bh6 & 65535, bl7 = bh7 & 65535, bh0 = bh0 >>> 16, bh1 = bh1 >>> 16, bh2 = bh2 >>> 16, 
                    bh3 = bh3 >>> 16, bh4 = bh4 >>> 16, bh5 = bh5 >>> 16, bh6 = bh6 >>> 16, bh7 = bh7 >>> 16;
                    r0 = HEAP32[(Rk | 0) >> 2] | 0, r1 = HEAP32[(Rk | 4) >> 2] | 0, r2 = HEAP32[(Rk | 8) >> 2] | 0, 
                    r3 = HEAP32[(Rk | 12) >> 2] | 0, r4 = HEAP32[(Rk | 16) >> 2] | 0, r5 = HEAP32[(Rk | 20) >> 2] | 0, 
                    r6 = HEAP32[(Rk | 24) >> 2] | 0, r7 = HEAP32[(Rk | 28) >> 2] | 0;
                    u = ((imul(al0, bl0) | 0) + (r8 & 65535) | 0) + (r0 & 65535) | 0;
                    v = ((imul(ah0, bl0) | 0) + (r8 >>> 16) | 0) + (r0 >>> 16) | 0;
                    w = ((imul(al0, bh0) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah0, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r0 = w << 16 | u & 65535;
                    u = ((imul(al0, bl1) | 0) + (m & 65535) | 0) + (r1 & 65535) | 0;
                    v = ((imul(ah0, bl1) | 0) + (m >>> 16) | 0) + (r1 >>> 16) | 0;
                    w = ((imul(al0, bh1) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah0, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r1 = w << 16 | u & 65535;
                    u = ((imul(al0, bl2) | 0) + (m & 65535) | 0) + (r2 & 65535) | 0;
                    v = ((imul(ah0, bl2) | 0) + (m >>> 16) | 0) + (r2 >>> 16) | 0;
                    w = ((imul(al0, bh2) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah0, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r2 = w << 16 | u & 65535;
                    u = ((imul(al0, bl3) | 0) + (m & 65535) | 0) + (r3 & 65535) | 0;
                    v = ((imul(ah0, bl3) | 0) + (m >>> 16) | 0) + (r3 >>> 16) | 0;
                    w = ((imul(al0, bh3) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah0, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r3 = w << 16 | u & 65535;
                    u = ((imul(al0, bl4) | 0) + (m & 65535) | 0) + (r4 & 65535) | 0;
                    v = ((imul(ah0, bl4) | 0) + (m >>> 16) | 0) + (r4 >>> 16) | 0;
                    w = ((imul(al0, bh4) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah0, bh4) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r4 = w << 16 | u & 65535;
                    u = ((imul(al0, bl5) | 0) + (m & 65535) | 0) + (r5 & 65535) | 0;
                    v = ((imul(ah0, bl5) | 0) + (m >>> 16) | 0) + (r5 >>> 16) | 0;
                    w = ((imul(al0, bh5) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah0, bh5) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r5 = w << 16 | u & 65535;
                    u = ((imul(al0, bl6) | 0) + (m & 65535) | 0) + (r6 & 65535) | 0;
                    v = ((imul(ah0, bl6) | 0) + (m >>> 16) | 0) + (r6 >>> 16) | 0;
                    w = ((imul(al0, bh6) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah0, bh6) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r6 = w << 16 | u & 65535;
                    u = ((imul(al0, bl7) | 0) + (m & 65535) | 0) + (r7 & 65535) | 0;
                    v = ((imul(ah0, bl7) | 0) + (m >>> 16) | 0) + (r7 >>> 16) | 0;
                    w = ((imul(al0, bh7) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah0, bh7) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r7 = w << 16 | u & 65535;
                    r8 = m;
                    u = ((imul(al1, bl0) | 0) + (r9 & 65535) | 0) + (r1 & 65535) | 0;
                    v = ((imul(ah1, bl0) | 0) + (r9 >>> 16) | 0) + (r1 >>> 16) | 0;
                    w = ((imul(al1, bh0) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah1, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r1 = w << 16 | u & 65535;
                    u = ((imul(al1, bl1) | 0) + (m & 65535) | 0) + (r2 & 65535) | 0;
                    v = ((imul(ah1, bl1) | 0) + (m >>> 16) | 0) + (r2 >>> 16) | 0;
                    w = ((imul(al1, bh1) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah1, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r2 = w << 16 | u & 65535;
                    u = ((imul(al1, bl2) | 0) + (m & 65535) | 0) + (r3 & 65535) | 0;
                    v = ((imul(ah1, bl2) | 0) + (m >>> 16) | 0) + (r3 >>> 16) | 0;
                    w = ((imul(al1, bh2) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah1, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r3 = w << 16 | u & 65535;
                    u = ((imul(al1, bl3) | 0) + (m & 65535) | 0) + (r4 & 65535) | 0;
                    v = ((imul(ah1, bl3) | 0) + (m >>> 16) | 0) + (r4 >>> 16) | 0;
                    w = ((imul(al1, bh3) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah1, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r4 = w << 16 | u & 65535;
                    u = ((imul(al1, bl4) | 0) + (m & 65535) | 0) + (r5 & 65535) | 0;
                    v = ((imul(ah1, bl4) | 0) + (m >>> 16) | 0) + (r5 >>> 16) | 0;
                    w = ((imul(al1, bh4) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah1, bh4) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r5 = w << 16 | u & 65535;
                    u = ((imul(al1, bl5) | 0) + (m & 65535) | 0) + (r6 & 65535) | 0;
                    v = ((imul(ah1, bl5) | 0) + (m >>> 16) | 0) + (r6 >>> 16) | 0;
                    w = ((imul(al1, bh5) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah1, bh5) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r6 = w << 16 | u & 65535;
                    u = ((imul(al1, bl6) | 0) + (m & 65535) | 0) + (r7 & 65535) | 0;
                    v = ((imul(ah1, bl6) | 0) + (m >>> 16) | 0) + (r7 >>> 16) | 0;
                    w = ((imul(al1, bh6) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah1, bh6) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r7 = w << 16 | u & 65535;
                    u = ((imul(al1, bl7) | 0) + (m & 65535) | 0) + (r8 & 65535) | 0;
                    v = ((imul(ah1, bl7) | 0) + (m >>> 16) | 0) + (r8 >>> 16) | 0;
                    w = ((imul(al1, bh7) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah1, bh7) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r8 = w << 16 | u & 65535;
                    r9 = m;
                    u = ((imul(al2, bl0) | 0) + (r10 & 65535) | 0) + (r2 & 65535) | 0;
                    v = ((imul(ah2, bl0) | 0) + (r10 >>> 16) | 0) + (r2 >>> 16) | 0;
                    w = ((imul(al2, bh0) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah2, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r2 = w << 16 | u & 65535;
                    u = ((imul(al2, bl1) | 0) + (m & 65535) | 0) + (r3 & 65535) | 0;
                    v = ((imul(ah2, bl1) | 0) + (m >>> 16) | 0) + (r3 >>> 16) | 0;
                    w = ((imul(al2, bh1) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah2, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r3 = w << 16 | u & 65535;
                    u = ((imul(al2, bl2) | 0) + (m & 65535) | 0) + (r4 & 65535) | 0;
                    v = ((imul(ah2, bl2) | 0) + (m >>> 16) | 0) + (r4 >>> 16) | 0;
                    w = ((imul(al2, bh2) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah2, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r4 = w << 16 | u & 65535;
                    u = ((imul(al2, bl3) | 0) + (m & 65535) | 0) + (r5 & 65535) | 0;
                    v = ((imul(ah2, bl3) | 0) + (m >>> 16) | 0) + (r5 >>> 16) | 0;
                    w = ((imul(al2, bh3) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah2, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r5 = w << 16 | u & 65535;
                    u = ((imul(al2, bl4) | 0) + (m & 65535) | 0) + (r6 & 65535) | 0;
                    v = ((imul(ah2, bl4) | 0) + (m >>> 16) | 0) + (r6 >>> 16) | 0;
                    w = ((imul(al2, bh4) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah2, bh4) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r6 = w << 16 | u & 65535;
                    u = ((imul(al2, bl5) | 0) + (m & 65535) | 0) + (r7 & 65535) | 0;
                    v = ((imul(ah2, bl5) | 0) + (m >>> 16) | 0) + (r7 >>> 16) | 0;
                    w = ((imul(al2, bh5) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah2, bh5) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r7 = w << 16 | u & 65535;
                    u = ((imul(al2, bl6) | 0) + (m & 65535) | 0) + (r8 & 65535) | 0;
                    v = ((imul(ah2, bl6) | 0) + (m >>> 16) | 0) + (r8 >>> 16) | 0;
                    w = ((imul(al2, bh6) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah2, bh6) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r8 = w << 16 | u & 65535;
                    u = ((imul(al2, bl7) | 0) + (m & 65535) | 0) + (r9 & 65535) | 0;
                    v = ((imul(ah2, bl7) | 0) + (m >>> 16) | 0) + (r9 >>> 16) | 0;
                    w = ((imul(al2, bh7) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah2, bh7) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r9 = w << 16 | u & 65535;
                    r10 = m;
                    u = ((imul(al3, bl0) | 0) + (r11 & 65535) | 0) + (r3 & 65535) | 0;
                    v = ((imul(ah3, bl0) | 0) + (r11 >>> 16) | 0) + (r3 >>> 16) | 0;
                    w = ((imul(al3, bh0) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah3, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r3 = w << 16 | u & 65535;
                    u = ((imul(al3, bl1) | 0) + (m & 65535) | 0) + (r4 & 65535) | 0;
                    v = ((imul(ah3, bl1) | 0) + (m >>> 16) | 0) + (r4 >>> 16) | 0;
                    w = ((imul(al3, bh1) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah3, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r4 = w << 16 | u & 65535;
                    u = ((imul(al3, bl2) | 0) + (m & 65535) | 0) + (r5 & 65535) | 0;
                    v = ((imul(ah3, bl2) | 0) + (m >>> 16) | 0) + (r5 >>> 16) | 0;
                    w = ((imul(al3, bh2) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah3, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r5 = w << 16 | u & 65535;
                    u = ((imul(al3, bl3) | 0) + (m & 65535) | 0) + (r6 & 65535) | 0;
                    v = ((imul(ah3, bl3) | 0) + (m >>> 16) | 0) + (r6 >>> 16) | 0;
                    w = ((imul(al3, bh3) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah3, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r6 = w << 16 | u & 65535;
                    u = ((imul(al3, bl4) | 0) + (m & 65535) | 0) + (r7 & 65535) | 0;
                    v = ((imul(ah3, bl4) | 0) + (m >>> 16) | 0) + (r7 >>> 16) | 0;
                    w = ((imul(al3, bh4) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah3, bh4) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r7 = w << 16 | u & 65535;
                    u = ((imul(al3, bl5) | 0) + (m & 65535) | 0) + (r8 & 65535) | 0;
                    v = ((imul(ah3, bl5) | 0) + (m >>> 16) | 0) + (r8 >>> 16) | 0;
                    w = ((imul(al3, bh5) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah3, bh5) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r8 = w << 16 | u & 65535;
                    u = ((imul(al3, bl6) | 0) + (m & 65535) | 0) + (r9 & 65535) | 0;
                    v = ((imul(ah3, bl6) | 0) + (m >>> 16) | 0) + (r9 >>> 16) | 0;
                    w = ((imul(al3, bh6) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah3, bh6) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r9 = w << 16 | u & 65535;
                    u = ((imul(al3, bl7) | 0) + (m & 65535) | 0) + (r10 & 65535) | 0;
                    v = ((imul(ah3, bl7) | 0) + (m >>> 16) | 0) + (r10 >>> 16) | 0;
                    w = ((imul(al3, bh7) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah3, bh7) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r10 = w << 16 | u & 65535;
                    r11 = m;
                    u = ((imul(al4, bl0) | 0) + (r12 & 65535) | 0) + (r4 & 65535) | 0;
                    v = ((imul(ah4, bl0) | 0) + (r12 >>> 16) | 0) + (r4 >>> 16) | 0;
                    w = ((imul(al4, bh0) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah4, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r4 = w << 16 | u & 65535;
                    u = ((imul(al4, bl1) | 0) + (m & 65535) | 0) + (r5 & 65535) | 0;
                    v = ((imul(ah4, bl1) | 0) + (m >>> 16) | 0) + (r5 >>> 16) | 0;
                    w = ((imul(al4, bh1) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah4, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r5 = w << 16 | u & 65535;
                    u = ((imul(al4, bl2) | 0) + (m & 65535) | 0) + (r6 & 65535) | 0;
                    v = ((imul(ah4, bl2) | 0) + (m >>> 16) | 0) + (r6 >>> 16) | 0;
                    w = ((imul(al4, bh2) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah4, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r6 = w << 16 | u & 65535;
                    u = ((imul(al4, bl3) | 0) + (m & 65535) | 0) + (r7 & 65535) | 0;
                    v = ((imul(ah4, bl3) | 0) + (m >>> 16) | 0) + (r7 >>> 16) | 0;
                    w = ((imul(al4, bh3) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah4, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r7 = w << 16 | u & 65535;
                    u = ((imul(al4, bl4) | 0) + (m & 65535) | 0) + (r8 & 65535) | 0;
                    v = ((imul(ah4, bl4) | 0) + (m >>> 16) | 0) + (r8 >>> 16) | 0;
                    w = ((imul(al4, bh4) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah4, bh4) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r8 = w << 16 | u & 65535;
                    u = ((imul(al4, bl5) | 0) + (m & 65535) | 0) + (r9 & 65535) | 0;
                    v = ((imul(ah4, bl5) | 0) + (m >>> 16) | 0) + (r9 >>> 16) | 0;
                    w = ((imul(al4, bh5) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah4, bh5) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r9 = w << 16 | u & 65535;
                    u = ((imul(al4, bl6) | 0) + (m & 65535) | 0) + (r10 & 65535) | 0;
                    v = ((imul(ah4, bl6) | 0) + (m >>> 16) | 0) + (r10 >>> 16) | 0;
                    w = ((imul(al4, bh6) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah4, bh6) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r10 = w << 16 | u & 65535;
                    u = ((imul(al4, bl7) | 0) + (m & 65535) | 0) + (r11 & 65535) | 0;
                    v = ((imul(ah4, bl7) | 0) + (m >>> 16) | 0) + (r11 >>> 16) | 0;
                    w = ((imul(al4, bh7) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah4, bh7) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r11 = w << 16 | u & 65535;
                    r12 = m;
                    u = ((imul(al5, bl0) | 0) + (r13 & 65535) | 0) + (r5 & 65535) | 0;
                    v = ((imul(ah5, bl0) | 0) + (r13 >>> 16) | 0) + (r5 >>> 16) | 0;
                    w = ((imul(al5, bh0) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah5, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r5 = w << 16 | u & 65535;
                    u = ((imul(al5, bl1) | 0) + (m & 65535) | 0) + (r6 & 65535) | 0;
                    v = ((imul(ah5, bl1) | 0) + (m >>> 16) | 0) + (r6 >>> 16) | 0;
                    w = ((imul(al5, bh1) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah5, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r6 = w << 16 | u & 65535;
                    u = ((imul(al5, bl2) | 0) + (m & 65535) | 0) + (r7 & 65535) | 0;
                    v = ((imul(ah5, bl2) | 0) + (m >>> 16) | 0) + (r7 >>> 16) | 0;
                    w = ((imul(al5, bh2) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah5, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r7 = w << 16 | u & 65535;
                    u = ((imul(al5, bl3) | 0) + (m & 65535) | 0) + (r8 & 65535) | 0;
                    v = ((imul(ah5, bl3) | 0) + (m >>> 16) | 0) + (r8 >>> 16) | 0;
                    w = ((imul(al5, bh3) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah5, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r8 = w << 16 | u & 65535;
                    u = ((imul(al5, bl4) | 0) + (m & 65535) | 0) + (r9 & 65535) | 0;
                    v = ((imul(ah5, bl4) | 0) + (m >>> 16) | 0) + (r9 >>> 16) | 0;
                    w = ((imul(al5, bh4) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah5, bh4) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r9 = w << 16 | u & 65535;
                    u = ((imul(al5, bl5) | 0) + (m & 65535) | 0) + (r10 & 65535) | 0;
                    v = ((imul(ah5, bl5) | 0) + (m >>> 16) | 0) + (r10 >>> 16) | 0;
                    w = ((imul(al5, bh5) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah5, bh5) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r10 = w << 16 | u & 65535;
                    u = ((imul(al5, bl6) | 0) + (m & 65535) | 0) + (r11 & 65535) | 0;
                    v = ((imul(ah5, bl6) | 0) + (m >>> 16) | 0) + (r11 >>> 16) | 0;
                    w = ((imul(al5, bh6) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah5, bh6) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r11 = w << 16 | u & 65535;
                    u = ((imul(al5, bl7) | 0) + (m & 65535) | 0) + (r12 & 65535) | 0;
                    v = ((imul(ah5, bl7) | 0) + (m >>> 16) | 0) + (r12 >>> 16) | 0;
                    w = ((imul(al5, bh7) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah5, bh7) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r12 = w << 16 | u & 65535;
                    r13 = m;
                    u = ((imul(al6, bl0) | 0) + (r14 & 65535) | 0) + (r6 & 65535) | 0;
                    v = ((imul(ah6, bl0) | 0) + (r14 >>> 16) | 0) + (r6 >>> 16) | 0;
                    w = ((imul(al6, bh0) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah6, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r6 = w << 16 | u & 65535;
                    u = ((imul(al6, bl1) | 0) + (m & 65535) | 0) + (r7 & 65535) | 0;
                    v = ((imul(ah6, bl1) | 0) + (m >>> 16) | 0) + (r7 >>> 16) | 0;
                    w = ((imul(al6, bh1) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah6, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r7 = w << 16 | u & 65535;
                    u = ((imul(al6, bl2) | 0) + (m & 65535) | 0) + (r8 & 65535) | 0;
                    v = ((imul(ah6, bl2) | 0) + (m >>> 16) | 0) + (r8 >>> 16) | 0;
                    w = ((imul(al6, bh2) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah6, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r8 = w << 16 | u & 65535;
                    u = ((imul(al6, bl3) | 0) + (m & 65535) | 0) + (r9 & 65535) | 0;
                    v = ((imul(ah6, bl3) | 0) + (m >>> 16) | 0) + (r9 >>> 16) | 0;
                    w = ((imul(al6, bh3) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah6, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r9 = w << 16 | u & 65535;
                    u = ((imul(al6, bl4) | 0) + (m & 65535) | 0) + (r10 & 65535) | 0;
                    v = ((imul(ah6, bl4) | 0) + (m >>> 16) | 0) + (r10 >>> 16) | 0;
                    w = ((imul(al6, bh4) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah6, bh4) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r10 = w << 16 | u & 65535;
                    u = ((imul(al6, bl5) | 0) + (m & 65535) | 0) + (r11 & 65535) | 0;
                    v = ((imul(ah6, bl5) | 0) + (m >>> 16) | 0) + (r11 >>> 16) | 0;
                    w = ((imul(al6, bh5) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah6, bh5) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r11 = w << 16 | u & 65535;
                    u = ((imul(al6, bl6) | 0) + (m & 65535) | 0) + (r12 & 65535) | 0;
                    v = ((imul(ah6, bl6) | 0) + (m >>> 16) | 0) + (r12 >>> 16) | 0;
                    w = ((imul(al6, bh6) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah6, bh6) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r12 = w << 16 | u & 65535;
                    u = ((imul(al6, bl7) | 0) + (m & 65535) | 0) + (r13 & 65535) | 0;
                    v = ((imul(ah6, bl7) | 0) + (m >>> 16) | 0) + (r13 >>> 16) | 0;
                    w = ((imul(al6, bh7) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah6, bh7) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r13 = w << 16 | u & 65535;
                    r14 = m;
                    u = ((imul(al7, bl0) | 0) + (r15 & 65535) | 0) + (r7 & 65535) | 0;
                    v = ((imul(ah7, bl0) | 0) + (r15 >>> 16) | 0) + (r7 >>> 16) | 0;
                    w = ((imul(al7, bh0) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah7, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r7 = w << 16 | u & 65535;
                    u = ((imul(al7, bl1) | 0) + (m & 65535) | 0) + (r8 & 65535) | 0;
                    v = ((imul(ah7, bl1) | 0) + (m >>> 16) | 0) + (r8 >>> 16) | 0;
                    w = ((imul(al7, bh1) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah7, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r8 = w << 16 | u & 65535;
                    u = ((imul(al7, bl2) | 0) + (m & 65535) | 0) + (r9 & 65535) | 0;
                    v = ((imul(ah7, bl2) | 0) + (m >>> 16) | 0) + (r9 >>> 16) | 0;
                    w = ((imul(al7, bh2) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah7, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r9 = w << 16 | u & 65535;
                    u = ((imul(al7, bl3) | 0) + (m & 65535) | 0) + (r10 & 65535) | 0;
                    v = ((imul(ah7, bl3) | 0) + (m >>> 16) | 0) + (r10 >>> 16) | 0;
                    w = ((imul(al7, bh3) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah7, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r10 = w << 16 | u & 65535;
                    u = ((imul(al7, bl4) | 0) + (m & 65535) | 0) + (r11 & 65535) | 0;
                    v = ((imul(ah7, bl4) | 0) + (m >>> 16) | 0) + (r11 >>> 16) | 0;
                    w = ((imul(al7, bh4) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah7, bh4) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r11 = w << 16 | u & 65535;
                    u = ((imul(al7, bl5) | 0) + (m & 65535) | 0) + (r12 & 65535) | 0;
                    v = ((imul(ah7, bl5) | 0) + (m >>> 16) | 0) + (r12 >>> 16) | 0;
                    w = ((imul(al7, bh5) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah7, bh5) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r12 = w << 16 | u & 65535;
                    u = ((imul(al7, bl6) | 0) + (m & 65535) | 0) + (r13 & 65535) | 0;
                    v = ((imul(ah7, bl6) | 0) + (m >>> 16) | 0) + (r13 >>> 16) | 0;
                    w = ((imul(al7, bh6) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah7, bh6) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r13 = w << 16 | u & 65535;
                    u = ((imul(al7, bl7) | 0) + (m & 65535) | 0) + (r14 & 65535) | 0;
                    v = ((imul(ah7, bl7) | 0) + (m >>> 16) | 0) + (r14 >>> 16) | 0;
                    w = ((imul(al7, bh7) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                    m = ((imul(ah7, bh7) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                    r14 = w << 16 | u & 65535;
                    r15 = m;
                    HEAP32[(Rk | 0) >> 2] = r0, HEAP32[(Rk | 4) >> 2] = r1, HEAP32[(Rk | 8) >> 2] = r2, 
                    HEAP32[(Rk | 12) >> 2] = r3, HEAP32[(Rk | 16) >> 2] = r4, HEAP32[(Rk | 20) >> 2] = r5, 
                    HEAP32[(Rk | 24) >> 2] = r6, HEAP32[(Rk | 28) >> 2] = r7;
                }
                Rk = R + (i + j | 0) | 0;
                HEAP32[(Rk | 0) >> 2] = r8, HEAP32[(Rk | 4) >> 2] = r9, HEAP32[(Rk | 8) >> 2] = r10, 
                HEAP32[(Rk | 12) >> 2] = r11, HEAP32[(Rk | 16) >> 2] = r12, HEAP32[(Rk | 20) >> 2] = r13, 
                HEAP32[(Rk | 24) >> 2] = r14, HEAP32[(Rk | 28) >> 2] = r15;
            }
        }
        function sqr(A, lA, R) {
            A = A | 0;
            lA = lA | 0;
            R = R | 0;
            var al0 = 0, al1 = 0, al2 = 0, al3 = 0, al4 = 0, al5 = 0, al6 = 0, al7 = 0, ah0 = 0, ah1 = 0, ah2 = 0, ah3 = 0, ah4 = 0, ah5 = 0, ah6 = 0, ah7 = 0, bl0 = 0, bl1 = 0, bl2 = 0, bl3 = 0, bl4 = 0, bl5 = 0, bl6 = 0, bl7 = 0, bh0 = 0, bh1 = 0, bh2 = 0, bh3 = 0, bh4 = 0, bh5 = 0, bh6 = 0, bh7 = 0, r0 = 0, r1 = 0, r2 = 0, r3 = 0, r4 = 0, r5 = 0, r6 = 0, r7 = 0, r8 = 0, r9 = 0, r10 = 0, r11 = 0, r12 = 0, r13 = 0, r14 = 0, r15 = 0, u = 0, v = 0, w = 0, c = 0, h = 0, m = 0, r = 0, d = 0, dd = 0, p = 0, i = 0, j = 0, k = 0, Ai = 0, Aj = 0, Rk = 0;
            for (;(i | 0) < (lA | 0); i = i + 4 | 0) {
                Rk = R + (i << 1) | 0;
                ah0 = HEAP32[A + i >> 2] | 0, al0 = ah0 & 65535, ah0 = ah0 >>> 16;
                u = imul(al0, al0) | 0;
                v = (imul(al0, ah0) | 0) + (u >>> 17) | 0;
                w = (imul(ah0, ah0) | 0) + (v >>> 15) | 0;
                HEAP32[Rk >> 2] = v << 17 | u & 131071;
                HEAP32[(Rk | 4) >> 2] = w;
            }
            for (p = 0; (p | 0) < (lA | 0); p = p + 8 | 0) {
                Ai = A + p | 0, Rk = R + (p << 1) | 0;
                ah0 = HEAP32[Ai >> 2] | 0, al0 = ah0 & 65535, ah0 = ah0 >>> 16;
                bh0 = HEAP32[(Ai | 4) >> 2] | 0, bl0 = bh0 & 65535, bh0 = bh0 >>> 16;
                u = imul(al0, bl0) | 0;
                v = (imul(al0, bh0) | 0) + (u >>> 16) | 0;
                w = (imul(ah0, bl0) | 0) + (v & 65535) | 0;
                m = ((imul(ah0, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                r = HEAP32[(Rk | 4) >> 2] | 0;
                u = (r & 65535) + ((u & 65535) << 1) | 0;
                w = ((r >>> 16) + ((w & 65535) << 1) | 0) + (u >>> 16) | 0;
                HEAP32[(Rk | 4) >> 2] = w << 16 | u & 65535;
                c = w >>> 16;
                r = HEAP32[(Rk | 8) >> 2] | 0;
                u = ((r & 65535) + ((m & 65535) << 1) | 0) + c | 0;
                w = ((r >>> 16) + (m >>> 16 << 1) | 0) + (u >>> 16) | 0;
                HEAP32[(Rk | 8) >> 2] = w << 16 | u & 65535;
                c = w >>> 16;
                if (c) {
                    r = HEAP32[(Rk | 12) >> 2] | 0;
                    u = (r & 65535) + c | 0;
                    w = (r >>> 16) + (u >>> 16) | 0;
                    HEAP32[(Rk | 12) >> 2] = w << 16 | u & 65535;
                }
            }
            for (p = 0; (p | 0) < (lA | 0); p = p + 16 | 0) {
                Ai = A + p | 0, Rk = R + (p << 1) | 0;
                ah0 = HEAP32[Ai >> 2] | 0, al0 = ah0 & 65535, ah0 = ah0 >>> 16, ah1 = HEAP32[(Ai | 4) >> 2] | 0, 
                al1 = ah1 & 65535, ah1 = ah1 >>> 16;
                bh0 = HEAP32[(Ai | 8) >> 2] | 0, bl0 = bh0 & 65535, bh0 = bh0 >>> 16, bh1 = HEAP32[(Ai | 12) >> 2] | 0, 
                bl1 = bh1 & 65535, bh1 = bh1 >>> 16;
                u = imul(al0, bl0) | 0;
                v = imul(ah0, bl0) | 0;
                w = ((imul(al0, bh0) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                m = ((imul(ah0, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                r0 = w << 16 | u & 65535;
                u = (imul(al0, bl1) | 0) + (m & 65535) | 0;
                v = (imul(ah0, bl1) | 0) + (m >>> 16) | 0;
                w = ((imul(al0, bh1) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                m = ((imul(ah0, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                r1 = w << 16 | u & 65535;
                r2 = m;
                u = (imul(al1, bl0) | 0) + (r1 & 65535) | 0;
                v = (imul(ah1, bl0) | 0) + (r1 >>> 16) | 0;
                w = ((imul(al1, bh0) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                m = ((imul(ah1, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                r1 = w << 16 | u & 65535;
                u = ((imul(al1, bl1) | 0) + (r2 & 65535) | 0) + (m & 65535) | 0;
                v = ((imul(ah1, bl1) | 0) + (r2 >>> 16) | 0) + (m >>> 16) | 0;
                w = ((imul(al1, bh1) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                m = ((imul(ah1, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                r2 = w << 16 | u & 65535;
                r3 = m;
                r = HEAP32[(Rk | 8) >> 2] | 0;
                u = (r & 65535) + ((r0 & 65535) << 1) | 0;
                w = ((r >>> 16) + (r0 >>> 16 << 1) | 0) + (u >>> 16) | 0;
                HEAP32[(Rk | 8) >> 2] = w << 16 | u & 65535;
                c = w >>> 16;
                r = HEAP32[(Rk | 12) >> 2] | 0;
                u = ((r & 65535) + ((r1 & 65535) << 1) | 0) + c | 0;
                w = ((r >>> 16) + (r1 >>> 16 << 1) | 0) + (u >>> 16) | 0;
                HEAP32[(Rk | 12) >> 2] = w << 16 | u & 65535;
                c = w >>> 16;
                r = HEAP32[(Rk | 16) >> 2] | 0;
                u = ((r & 65535) + ((r2 & 65535) << 1) | 0) + c | 0;
                w = ((r >>> 16) + (r2 >>> 16 << 1) | 0) + (u >>> 16) | 0;
                HEAP32[(Rk | 16) >> 2] = w << 16 | u & 65535;
                c = w >>> 16;
                r = HEAP32[(Rk | 20) >> 2] | 0;
                u = ((r & 65535) + ((r3 & 65535) << 1) | 0) + c | 0;
                w = ((r >>> 16) + (r3 >>> 16 << 1) | 0) + (u >>> 16) | 0;
                HEAP32[(Rk | 20) >> 2] = w << 16 | u & 65535;
                c = w >>> 16;
                for (k = 24; !!c & (k | 0) < 32; k = k + 4 | 0) {
                    r = HEAP32[(Rk | k) >> 2] | 0;
                    u = (r & 65535) + c | 0;
                    w = (r >>> 16) + (u >>> 16) | 0;
                    HEAP32[(Rk | k) >> 2] = w << 16 | u & 65535;
                    c = w >>> 16;
                }
            }
            for (p = 0; (p | 0) < (lA | 0); p = p + 32 | 0) {
                Ai = A + p | 0, Rk = R + (p << 1) | 0;
                ah0 = HEAP32[Ai >> 2] | 0, al0 = ah0 & 65535, ah0 = ah0 >>> 16, ah1 = HEAP32[(Ai | 4) >> 2] | 0, 
                al1 = ah1 & 65535, ah1 = ah1 >>> 16, ah2 = HEAP32[(Ai | 8) >> 2] | 0, al2 = ah2 & 65535, 
                ah2 = ah2 >>> 16, ah3 = HEAP32[(Ai | 12) >> 2] | 0, al3 = ah3 & 65535, ah3 = ah3 >>> 16;
                bh0 = HEAP32[(Ai | 16) >> 2] | 0, bl0 = bh0 & 65535, bh0 = bh0 >>> 16, bh1 = HEAP32[(Ai | 20) >> 2] | 0, 
                bl1 = bh1 & 65535, bh1 = bh1 >>> 16, bh2 = HEAP32[(Ai | 24) >> 2] | 0, bl2 = bh2 & 65535, 
                bh2 = bh2 >>> 16, bh3 = HEAP32[(Ai | 28) >> 2] | 0, bl3 = bh3 & 65535, bh3 = bh3 >>> 16;
                u = imul(al0, bl0) | 0;
                v = imul(ah0, bl0) | 0;
                w = ((imul(al0, bh0) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                m = ((imul(ah0, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                r0 = w << 16 | u & 65535;
                u = (imul(al0, bl1) | 0) + (m & 65535) | 0;
                v = (imul(ah0, bl1) | 0) + (m >>> 16) | 0;
                w = ((imul(al0, bh1) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                m = ((imul(ah0, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                r1 = w << 16 | u & 65535;
                u = (imul(al0, bl2) | 0) + (m & 65535) | 0;
                v = (imul(ah0, bl2) | 0) + (m >>> 16) | 0;
                w = ((imul(al0, bh2) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                m = ((imul(ah0, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                r2 = w << 16 | u & 65535;
                u = (imul(al0, bl3) | 0) + (m & 65535) | 0;
                v = (imul(ah0, bl3) | 0) + (m >>> 16) | 0;
                w = ((imul(al0, bh3) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                m = ((imul(ah0, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                r3 = w << 16 | u & 65535;
                r4 = m;
                u = (imul(al1, bl0) | 0) + (r1 & 65535) | 0;
                v = (imul(ah1, bl0) | 0) + (r1 >>> 16) | 0;
                w = ((imul(al1, bh0) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                m = ((imul(ah1, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                r1 = w << 16 | u & 65535;
                u = ((imul(al1, bl1) | 0) + (r2 & 65535) | 0) + (m & 65535) | 0;
                v = ((imul(ah1, bl1) | 0) + (r2 >>> 16) | 0) + (m >>> 16) | 0;
                w = ((imul(al1, bh1) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                m = ((imul(ah1, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                r2 = w << 16 | u & 65535;
                u = ((imul(al1, bl2) | 0) + (r3 & 65535) | 0) + (m & 65535) | 0;
                v = ((imul(ah1, bl2) | 0) + (r3 >>> 16) | 0) + (m >>> 16) | 0;
                w = ((imul(al1, bh2) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                m = ((imul(ah1, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                r3 = w << 16 | u & 65535;
                u = ((imul(al1, bl3) | 0) + (r4 & 65535) | 0) + (m & 65535) | 0;
                v = ((imul(ah1, bl3) | 0) + (r4 >>> 16) | 0) + (m >>> 16) | 0;
                w = ((imul(al1, bh3) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                m = ((imul(ah1, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                r4 = w << 16 | u & 65535;
                r5 = m;
                u = (imul(al2, bl0) | 0) + (r2 & 65535) | 0;
                v = (imul(ah2, bl0) | 0) + (r2 >>> 16) | 0;
                w = ((imul(al2, bh0) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                m = ((imul(ah2, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                r2 = w << 16 | u & 65535;
                u = ((imul(al2, bl1) | 0) + (r3 & 65535) | 0) + (m & 65535) | 0;
                v = ((imul(ah2, bl1) | 0) + (r3 >>> 16) | 0) + (m >>> 16) | 0;
                w = ((imul(al2, bh1) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                m = ((imul(ah2, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                r3 = w << 16 | u & 65535;
                u = ((imul(al2, bl2) | 0) + (r4 & 65535) | 0) + (m & 65535) | 0;
                v = ((imul(ah2, bl2) | 0) + (r4 >>> 16) | 0) + (m >>> 16) | 0;
                w = ((imul(al2, bh2) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                m = ((imul(ah2, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                r4 = w << 16 | u & 65535;
                u = ((imul(al2, bl3) | 0) + (r5 & 65535) | 0) + (m & 65535) | 0;
                v = ((imul(ah2, bl3) | 0) + (r5 >>> 16) | 0) + (m >>> 16) | 0;
                w = ((imul(al2, bh3) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                m = ((imul(ah2, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                r5 = w << 16 | u & 65535;
                r6 = m;
                u = (imul(al3, bl0) | 0) + (r3 & 65535) | 0;
                v = (imul(ah3, bl0) | 0) + (r3 >>> 16) | 0;
                w = ((imul(al3, bh0) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                m = ((imul(ah3, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                r3 = w << 16 | u & 65535;
                u = ((imul(al3, bl1) | 0) + (r4 & 65535) | 0) + (m & 65535) | 0;
                v = ((imul(ah3, bl1) | 0) + (r4 >>> 16) | 0) + (m >>> 16) | 0;
                w = ((imul(al3, bh1) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                m = ((imul(ah3, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                r4 = w << 16 | u & 65535;
                u = ((imul(al3, bl2) | 0) + (r5 & 65535) | 0) + (m & 65535) | 0;
                v = ((imul(ah3, bl2) | 0) + (r5 >>> 16) | 0) + (m >>> 16) | 0;
                w = ((imul(al3, bh2) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                m = ((imul(ah3, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                r5 = w << 16 | u & 65535;
                u = ((imul(al3, bl3) | 0) + (r6 & 65535) | 0) + (m & 65535) | 0;
                v = ((imul(ah3, bl3) | 0) + (r6 >>> 16) | 0) + (m >>> 16) | 0;
                w = ((imul(al3, bh3) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                m = ((imul(ah3, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                r6 = w << 16 | u & 65535;
                r7 = m;
                r = HEAP32[(Rk | 16) >> 2] | 0;
                u = (r & 65535) + ((r0 & 65535) << 1) | 0;
                w = ((r >>> 16) + (r0 >>> 16 << 1) | 0) + (u >>> 16) | 0;
                HEAP32[(Rk | 16) >> 2] = w << 16 | u & 65535;
                c = w >>> 16;
                r = HEAP32[(Rk | 20) >> 2] | 0;
                u = ((r & 65535) + ((r1 & 65535) << 1) | 0) + c | 0;
                w = ((r >>> 16) + (r1 >>> 16 << 1) | 0) + (u >>> 16) | 0;
                HEAP32[(Rk | 20) >> 2] = w << 16 | u & 65535;
                c = w >>> 16;
                r = HEAP32[(Rk | 24) >> 2] | 0;
                u = ((r & 65535) + ((r2 & 65535) << 1) | 0) + c | 0;
                w = ((r >>> 16) + (r2 >>> 16 << 1) | 0) + (u >>> 16) | 0;
                HEAP32[(Rk | 24) >> 2] = w << 16 | u & 65535;
                c = w >>> 16;
                r = HEAP32[(Rk | 28) >> 2] | 0;
                u = ((r & 65535) + ((r3 & 65535) << 1) | 0) + c | 0;
                w = ((r >>> 16) + (r3 >>> 16 << 1) | 0) + (u >>> 16) | 0;
                HEAP32[(Rk | 28) >> 2] = w << 16 | u & 65535;
                c = w >>> 16;
                r = HEAP32[Rk + 32 >> 2] | 0;
                u = ((r & 65535) + ((r4 & 65535) << 1) | 0) + c | 0;
                w = ((r >>> 16) + (r4 >>> 16 << 1) | 0) + (u >>> 16) | 0;
                HEAP32[Rk + 32 >> 2] = w << 16 | u & 65535;
                c = w >>> 16;
                r = HEAP32[Rk + 36 >> 2] | 0;
                u = ((r & 65535) + ((r5 & 65535) << 1) | 0) + c | 0;
                w = ((r >>> 16) + (r5 >>> 16 << 1) | 0) + (u >>> 16) | 0;
                HEAP32[Rk + 36 >> 2] = w << 16 | u & 65535;
                c = w >>> 16;
                r = HEAP32[Rk + 40 >> 2] | 0;
                u = ((r & 65535) + ((r6 & 65535) << 1) | 0) + c | 0;
                w = ((r >>> 16) + (r6 >>> 16 << 1) | 0) + (u >>> 16) | 0;
                HEAP32[Rk + 40 >> 2] = w << 16 | u & 65535;
                c = w >>> 16;
                r = HEAP32[Rk + 44 >> 2] | 0;
                u = ((r & 65535) + ((r7 & 65535) << 1) | 0) + c | 0;
                w = ((r >>> 16) + (r7 >>> 16 << 1) | 0) + (u >>> 16) | 0;
                HEAP32[Rk + 44 >> 2] = w << 16 | u & 65535;
                c = w >>> 16;
                for (k = 48; !!c & (k | 0) < 64; k = k + 4 | 0) {
                    r = HEAP32[Rk + k >> 2] | 0;
                    u = (r & 65535) + c | 0;
                    w = (r >>> 16) + (u >>> 16) | 0;
                    HEAP32[Rk + k >> 2] = w << 16 | u & 65535;
                    c = w >>> 16;
                }
            }
            for (d = 32; (d | 0) < (lA | 0); d = d << 1) {
                dd = d << 1;
                for (p = 0; (p | 0) < (lA | 0); p = p + dd | 0) {
                    Rk = R + (p << 1) | 0;
                    h = 0;
                    for (i = 0; (i | 0) < (d | 0); i = i + 32 | 0) {
                        Ai = (A + p | 0) + i | 0;
                        ah0 = HEAP32[Ai >> 2] | 0, al0 = ah0 & 65535, ah0 = ah0 >>> 16, ah1 = HEAP32[(Ai | 4) >> 2] | 0, 
                        al1 = ah1 & 65535, ah1 = ah1 >>> 16, ah2 = HEAP32[(Ai | 8) >> 2] | 0, al2 = ah2 & 65535, 
                        ah2 = ah2 >>> 16, ah3 = HEAP32[(Ai | 12) >> 2] | 0, al3 = ah3 & 65535, ah3 = ah3 >>> 16, 
                        ah4 = HEAP32[(Ai | 16) >> 2] | 0, al4 = ah4 & 65535, ah4 = ah4 >>> 16, ah5 = HEAP32[(Ai | 20) >> 2] | 0, 
                        al5 = ah5 & 65535, ah5 = ah5 >>> 16, ah6 = HEAP32[(Ai | 24) >> 2] | 0, al6 = ah6 & 65535, 
                        ah6 = ah6 >>> 16, ah7 = HEAP32[(Ai | 28) >> 2] | 0, al7 = ah7 & 65535, ah7 = ah7 >>> 16;
                        r8 = r9 = r10 = r11 = r12 = r13 = r14 = r15 = c = 0;
                        for (j = 0; (j | 0) < (d | 0); j = j + 32 | 0) {
                            Aj = ((A + p | 0) + d | 0) + j | 0;
                            bh0 = HEAP32[Aj >> 2] | 0, bl0 = bh0 & 65535, bh0 = bh0 >>> 16, bh1 = HEAP32[(Aj | 4) >> 2] | 0, 
                            bl1 = bh1 & 65535, bh1 = bh1 >>> 16, bh2 = HEAP32[(Aj | 8) >> 2] | 0, bl2 = bh2 & 65535, 
                            bh2 = bh2 >>> 16, bh3 = HEAP32[(Aj | 12) >> 2] | 0, bl3 = bh3 & 65535, bh3 = bh3 >>> 16, 
                            bh4 = HEAP32[(Aj | 16) >> 2] | 0, bl4 = bh4 & 65535, bh4 = bh4 >>> 16, bh5 = HEAP32[(Aj | 20) >> 2] | 0, 
                            bl5 = bh5 & 65535, bh5 = bh5 >>> 16, bh6 = HEAP32[(Aj | 24) >> 2] | 0, bl6 = bh6 & 65535, 
                            bh6 = bh6 >>> 16, bh7 = HEAP32[(Aj | 28) >> 2] | 0, bl7 = bh7 & 65535, bh7 = bh7 >>> 16;
                            r0 = r1 = r2 = r3 = r4 = r5 = r6 = r7 = 0;
                            u = ((imul(al0, bl0) | 0) + (r0 & 65535) | 0) + (r8 & 65535) | 0;
                            v = ((imul(ah0, bl0) | 0) + (r0 >>> 16) | 0) + (r8 >>> 16) | 0;
                            w = ((imul(al0, bh0) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah0, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r0 = w << 16 | u & 65535;
                            u = ((imul(al0, bl1) | 0) + (r1 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah0, bl1) | 0) + (r1 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al0, bh1) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah0, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r1 = w << 16 | u & 65535;
                            u = ((imul(al0, bl2) | 0) + (r2 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah0, bl2) | 0) + (r2 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al0, bh2) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah0, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r2 = w << 16 | u & 65535;
                            u = ((imul(al0, bl3) | 0) + (r3 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah0, bl3) | 0) + (r3 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al0, bh3) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah0, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r3 = w << 16 | u & 65535;
                            u = ((imul(al0, bl4) | 0) + (r4 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah0, bl4) | 0) + (r4 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al0, bh4) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah0, bh4) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r4 = w << 16 | u & 65535;
                            u = ((imul(al0, bl5) | 0) + (r5 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah0, bl5) | 0) + (r5 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al0, bh5) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah0, bh5) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r5 = w << 16 | u & 65535;
                            u = ((imul(al0, bl6) | 0) + (r6 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah0, bl6) | 0) + (r6 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al0, bh6) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah0, bh6) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r6 = w << 16 | u & 65535;
                            u = ((imul(al0, bl7) | 0) + (r7 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah0, bl7) | 0) + (r7 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al0, bh7) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah0, bh7) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r7 = w << 16 | u & 65535;
                            r8 = m;
                            u = ((imul(al1, bl0) | 0) + (r1 & 65535) | 0) + (r9 & 65535) | 0;
                            v = ((imul(ah1, bl0) | 0) + (r1 >>> 16) | 0) + (r9 >>> 16) | 0;
                            w = ((imul(al1, bh0) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah1, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r1 = w << 16 | u & 65535;
                            u = ((imul(al1, bl1) | 0) + (r2 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah1, bl1) | 0) + (r2 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al1, bh1) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah1, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r2 = w << 16 | u & 65535;
                            u = ((imul(al1, bl2) | 0) + (r3 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah1, bl2) | 0) + (r3 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al1, bh2) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah1, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r3 = w << 16 | u & 65535;
                            u = ((imul(al1, bl3) | 0) + (r4 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah1, bl3) | 0) + (r4 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al1, bh3) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah1, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r4 = w << 16 | u & 65535;
                            u = ((imul(al1, bl4) | 0) + (r5 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah1, bl4) | 0) + (r5 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al1, bh4) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah1, bh4) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r5 = w << 16 | u & 65535;
                            u = ((imul(al1, bl5) | 0) + (r6 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah1, bl5) | 0) + (r6 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al1, bh5) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah1, bh5) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r6 = w << 16 | u & 65535;
                            u = ((imul(al1, bl6) | 0) + (r7 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah1, bl6) | 0) + (r7 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al1, bh6) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah1, bh6) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r7 = w << 16 | u & 65535;
                            u = ((imul(al1, bl7) | 0) + (r8 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah1, bl7) | 0) + (r8 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al1, bh7) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah1, bh7) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r8 = w << 16 | u & 65535;
                            r9 = m;
                            u = ((imul(al2, bl0) | 0) + (r2 & 65535) | 0) + (r10 & 65535) | 0;
                            v = ((imul(ah2, bl0) | 0) + (r2 >>> 16) | 0) + (r10 >>> 16) | 0;
                            w = ((imul(al2, bh0) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah2, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r2 = w << 16 | u & 65535;
                            u = ((imul(al2, bl1) | 0) + (r3 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah2, bl1) | 0) + (r3 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al2, bh1) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah2, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r3 = w << 16 | u & 65535;
                            u = ((imul(al2, bl2) | 0) + (r4 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah2, bl2) | 0) + (r4 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al2, bh2) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah2, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r4 = w << 16 | u & 65535;
                            u = ((imul(al2, bl3) | 0) + (r5 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah2, bl3) | 0) + (r5 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al2, bh3) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah2, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r5 = w << 16 | u & 65535;
                            u = ((imul(al2, bl4) | 0) + (r6 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah2, bl4) | 0) + (r6 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al2, bh4) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah2, bh4) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r6 = w << 16 | u & 65535;
                            u = ((imul(al2, bl5) | 0) + (r7 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah2, bl5) | 0) + (r7 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al2, bh5) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah2, bh5) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r7 = w << 16 | u & 65535;
                            u = ((imul(al2, bl6) | 0) + (r8 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah2, bl6) | 0) + (r8 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al2, bh6) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah2, bh6) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r8 = w << 16 | u & 65535;
                            u = ((imul(al2, bl7) | 0) + (r9 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah2, bl7) | 0) + (r9 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al2, bh7) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah2, bh7) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r9 = w << 16 | u & 65535;
                            r10 = m;
                            u = ((imul(al3, bl0) | 0) + (r3 & 65535) | 0) + (r11 & 65535) | 0;
                            v = ((imul(ah3, bl0) | 0) + (r3 >>> 16) | 0) + (r11 >>> 16) | 0;
                            w = ((imul(al3, bh0) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah3, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r3 = w << 16 | u & 65535;
                            u = ((imul(al3, bl1) | 0) + (r4 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah3, bl1) | 0) + (r4 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al3, bh1) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah3, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r4 = w << 16 | u & 65535;
                            u = ((imul(al3, bl2) | 0) + (r5 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah3, bl2) | 0) + (r5 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al3, bh2) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah3, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r5 = w << 16 | u & 65535;
                            u = ((imul(al3, bl3) | 0) + (r6 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah3, bl3) | 0) + (r6 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al3, bh3) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah3, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r6 = w << 16 | u & 65535;
                            u = ((imul(al3, bl4) | 0) + (r7 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah3, bl4) | 0) + (r7 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al3, bh4) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah3, bh4) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r7 = w << 16 | u & 65535;
                            u = ((imul(al3, bl5) | 0) + (r8 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah3, bl5) | 0) + (r8 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al3, bh5) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah3, bh5) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r8 = w << 16 | u & 65535;
                            u = ((imul(al3, bl6) | 0) + (r9 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah3, bl6) | 0) + (r9 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al3, bh6) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah3, bh6) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r9 = w << 16 | u & 65535;
                            u = ((imul(al3, bl7) | 0) + (r10 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah3, bl7) | 0) + (r10 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al3, bh7) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah3, bh7) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r10 = w << 16 | u & 65535;
                            r11 = m;
                            u = ((imul(al4, bl0) | 0) + (r4 & 65535) | 0) + (r12 & 65535) | 0;
                            v = ((imul(ah4, bl0) | 0) + (r4 >>> 16) | 0) + (r12 >>> 16) | 0;
                            w = ((imul(al4, bh0) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah4, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r4 = w << 16 | u & 65535;
                            u = ((imul(al4, bl1) | 0) + (r5 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah4, bl1) | 0) + (r5 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al4, bh1) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah4, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r5 = w << 16 | u & 65535;
                            u = ((imul(al4, bl2) | 0) + (r6 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah4, bl2) | 0) + (r6 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al4, bh2) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah4, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r6 = w << 16 | u & 65535;
                            u = ((imul(al4, bl3) | 0) + (r7 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah4, bl3) | 0) + (r7 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al4, bh3) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah4, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r7 = w << 16 | u & 65535;
                            u = ((imul(al4, bl4) | 0) + (r8 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah4, bl4) | 0) + (r8 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al4, bh4) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah4, bh4) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r8 = w << 16 | u & 65535;
                            u = ((imul(al4, bl5) | 0) + (r9 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah4, bl5) | 0) + (r9 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al4, bh5) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah4, bh5) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r9 = w << 16 | u & 65535;
                            u = ((imul(al4, bl6) | 0) + (r10 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah4, bl6) | 0) + (r10 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al4, bh6) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah4, bh6) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r10 = w << 16 | u & 65535;
                            u = ((imul(al4, bl7) | 0) + (r11 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah4, bl7) | 0) + (r11 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al4, bh7) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah4, bh7) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r11 = w << 16 | u & 65535;
                            r12 = m;
                            u = ((imul(al5, bl0) | 0) + (r5 & 65535) | 0) + (r13 & 65535) | 0;
                            v = ((imul(ah5, bl0) | 0) + (r5 >>> 16) | 0) + (r13 >>> 16) | 0;
                            w = ((imul(al5, bh0) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah5, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r5 = w << 16 | u & 65535;
                            u = ((imul(al5, bl1) | 0) + (r6 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah5, bl1) | 0) + (r6 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al5, bh1) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah5, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r6 = w << 16 | u & 65535;
                            u = ((imul(al5, bl2) | 0) + (r7 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah5, bl2) | 0) + (r7 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al5, bh2) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah5, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r7 = w << 16 | u & 65535;
                            u = ((imul(al5, bl3) | 0) + (r8 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah5, bl3) | 0) + (r8 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al5, bh3) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah5, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r8 = w << 16 | u & 65535;
                            u = ((imul(al5, bl4) | 0) + (r9 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah5, bl4) | 0) + (r9 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al5, bh4) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah5, bh4) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r9 = w << 16 | u & 65535;
                            u = ((imul(al5, bl5) | 0) + (r10 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah5, bl5) | 0) + (r10 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al5, bh5) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah5, bh5) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r10 = w << 16 | u & 65535;
                            u = ((imul(al5, bl6) | 0) + (r11 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah5, bl6) | 0) + (r11 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al5, bh6) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah5, bh6) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r11 = w << 16 | u & 65535;
                            u = ((imul(al5, bl7) | 0) + (r12 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah5, bl7) | 0) + (r12 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al5, bh7) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah5, bh7) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r12 = w << 16 | u & 65535;
                            r13 = m;
                            u = ((imul(al6, bl0) | 0) + (r6 & 65535) | 0) + (r14 & 65535) | 0;
                            v = ((imul(ah6, bl0) | 0) + (r6 >>> 16) | 0) + (r14 >>> 16) | 0;
                            w = ((imul(al6, bh0) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah6, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r6 = w << 16 | u & 65535;
                            u = ((imul(al6, bl1) | 0) + (r7 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah6, bl1) | 0) + (r7 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al6, bh1) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah6, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r7 = w << 16 | u & 65535;
                            u = ((imul(al6, bl2) | 0) + (r8 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah6, bl2) | 0) + (r8 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al6, bh2) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah6, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r8 = w << 16 | u & 65535;
                            u = ((imul(al6, bl3) | 0) + (r9 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah6, bl3) | 0) + (r9 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al6, bh3) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah6, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r9 = w << 16 | u & 65535;
                            u = ((imul(al6, bl4) | 0) + (r10 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah6, bl4) | 0) + (r10 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al6, bh4) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah6, bh4) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r10 = w << 16 | u & 65535;
                            u = ((imul(al6, bl5) | 0) + (r11 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah6, bl5) | 0) + (r11 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al6, bh5) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah6, bh5) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r11 = w << 16 | u & 65535;
                            u = ((imul(al6, bl6) | 0) + (r12 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah6, bl6) | 0) + (r12 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al6, bh6) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah6, bh6) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r12 = w << 16 | u & 65535;
                            u = ((imul(al6, bl7) | 0) + (r13 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah6, bl7) | 0) + (r13 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al6, bh7) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah6, bh7) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r13 = w << 16 | u & 65535;
                            r14 = m;
                            u = ((imul(al7, bl0) | 0) + (r7 & 65535) | 0) + (r15 & 65535) | 0;
                            v = ((imul(ah7, bl0) | 0) + (r7 >>> 16) | 0) + (r15 >>> 16) | 0;
                            w = ((imul(al7, bh0) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah7, bh0) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r7 = w << 16 | u & 65535;
                            u = ((imul(al7, bl1) | 0) + (r8 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah7, bl1) | 0) + (r8 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al7, bh1) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah7, bh1) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r8 = w << 16 | u & 65535;
                            u = ((imul(al7, bl2) | 0) + (r9 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah7, bl2) | 0) + (r9 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al7, bh2) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah7, bh2) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r9 = w << 16 | u & 65535;
                            u = ((imul(al7, bl3) | 0) + (r10 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah7, bl3) | 0) + (r10 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al7, bh3) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah7, bh3) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r10 = w << 16 | u & 65535;
                            u = ((imul(al7, bl4) | 0) + (r11 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah7, bl4) | 0) + (r11 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al7, bh4) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah7, bh4) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r11 = w << 16 | u & 65535;
                            u = ((imul(al7, bl5) | 0) + (r12 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah7, bl5) | 0) + (r12 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al7, bh5) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah7, bh5) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r12 = w << 16 | u & 65535;
                            u = ((imul(al7, bl6) | 0) + (r13 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah7, bl6) | 0) + (r13 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al7, bh6) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah7, bh6) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r13 = w << 16 | u & 65535;
                            u = ((imul(al7, bl7) | 0) + (r14 & 65535) | 0) + (m & 65535) | 0;
                            v = ((imul(ah7, bl7) | 0) + (r14 >>> 16) | 0) + (m >>> 16) | 0;
                            w = ((imul(al7, bh7) | 0) + (v & 65535) | 0) + (u >>> 16) | 0;
                            m = ((imul(ah7, bh7) | 0) + (v >>> 16) | 0) + (w >>> 16) | 0;
                            r14 = w << 16 | u & 65535;
                            r15 = m;
                            k = d + (i + j | 0) | 0;
                            r = HEAP32[Rk + k >> 2] | 0;
                            u = ((r & 65535) + ((r0 & 65535) << 1) | 0) + c | 0;
                            w = ((r >>> 16) + (r0 >>> 16 << 1) | 0) + (u >>> 16) | 0;
                            HEAP32[Rk + k >> 2] = w << 16 | u & 65535;
                            c = w >>> 16;
                            k = k + 4 | 0;
                            r = HEAP32[Rk + k >> 2] | 0;
                            u = ((r & 65535) + ((r1 & 65535) << 1) | 0) + c | 0;
                            w = ((r >>> 16) + (r1 >>> 16 << 1) | 0) + (u >>> 16) | 0;
                            HEAP32[Rk + k >> 2] = w << 16 | u & 65535;
                            c = w >>> 16;
                            k = k + 4 | 0;
                            r = HEAP32[Rk + k >> 2] | 0;
                            u = ((r & 65535) + ((r2 & 65535) << 1) | 0) + c | 0;
                            w = ((r >>> 16) + (r2 >>> 16 << 1) | 0) + (u >>> 16) | 0;
                            HEAP32[Rk + k >> 2] = w << 16 | u & 65535;
                            c = w >>> 16;
                            k = k + 4 | 0;
                            r = HEAP32[Rk + k >> 2] | 0;
                            u = ((r & 65535) + ((r3 & 65535) << 1) | 0) + c | 0;
                            w = ((r >>> 16) + (r3 >>> 16 << 1) | 0) + (u >>> 16) | 0;
                            HEAP32[Rk + k >> 2] = w << 16 | u & 65535;
                            c = w >>> 16;
                            k = k + 4 | 0;
                            r = HEAP32[Rk + k >> 2] | 0;
                            u = ((r & 65535) + ((r4 & 65535) << 1) | 0) + c | 0;
                            w = ((r >>> 16) + (r4 >>> 16 << 1) | 0) + (u >>> 16) | 0;
                            HEAP32[Rk + k >> 2] = w << 16 | u & 65535;
                            c = w >>> 16;
                            k = k + 4 | 0;
                            r = HEAP32[Rk + k >> 2] | 0;
                            u = ((r & 65535) + ((r5 & 65535) << 1) | 0) + c | 0;
                            w = ((r >>> 16) + (r5 >>> 16 << 1) | 0) + (u >>> 16) | 0;
                            HEAP32[Rk + k >> 2] = w << 16 | u & 65535;
                            c = w >>> 16;
                            k = k + 4 | 0;
                            r = HEAP32[Rk + k >> 2] | 0;
                            u = ((r & 65535) + ((r6 & 65535) << 1) | 0) + c | 0;
                            w = ((r >>> 16) + (r6 >>> 16 << 1) | 0) + (u >>> 16) | 0;
                            HEAP32[Rk + k >> 2] = w << 16 | u & 65535;
                            c = w >>> 16;
                            k = k + 4 | 0;
                            r = HEAP32[Rk + k >> 2] | 0;
                            u = ((r & 65535) + ((r7 & 65535) << 1) | 0) + c | 0;
                            w = ((r >>> 16) + (r7 >>> 16 << 1) | 0) + (u >>> 16) | 0;
                            HEAP32[Rk + k >> 2] = w << 16 | u & 65535;
                            c = w >>> 16;
                        }
                        k = d + (i + j | 0) | 0;
                        r = HEAP32[Rk + k >> 2] | 0;
                        u = (((r & 65535) + ((r8 & 65535) << 1) | 0) + c | 0) + h | 0;
                        w = ((r >>> 16) + (r8 >>> 16 << 1) | 0) + (u >>> 16) | 0;
                        HEAP32[Rk + k >> 2] = w << 16 | u & 65535;
                        c = w >>> 16;
                        k = k + 4 | 0;
                        r = HEAP32[Rk + k >> 2] | 0;
                        u = ((r & 65535) + ((r9 & 65535) << 1) | 0) + c | 0;
                        w = ((r >>> 16) + (r9 >>> 16 << 1) | 0) + (u >>> 16) | 0;
                        HEAP32[Rk + k >> 2] = w << 16 | u & 65535;
                        c = w >>> 16;
                        k = k + 4 | 0;
                        r = HEAP32[Rk + k >> 2] | 0;
                        u = ((r & 65535) + ((r10 & 65535) << 1) | 0) + c | 0;
                        w = ((r >>> 16) + (r10 >>> 16 << 1) | 0) + (u >>> 16) | 0;
                        HEAP32[Rk + k >> 2] = w << 16 | u & 65535;
                        c = w >>> 16;
                        k = k + 4 | 0;
                        r = HEAP32[Rk + k >> 2] | 0;
                        u = ((r & 65535) + ((r11 & 65535) << 1) | 0) + c | 0;
                        w = ((r >>> 16) + (r11 >>> 16 << 1) | 0) + (u >>> 16) | 0;
                        HEAP32[Rk + k >> 2] = w << 16 | u & 65535;
                        c = w >>> 16;
                        k = k + 4 | 0;
                        r = HEAP32[Rk + k >> 2] | 0;
                        u = ((r & 65535) + ((r12 & 65535) << 1) | 0) + c | 0;
                        w = ((r >>> 16) + (r12 >>> 16 << 1) | 0) + (u >>> 16) | 0;
                        HEAP32[Rk + k >> 2] = w << 16 | u & 65535;
                        c = w >>> 16;
                        k = k + 4 | 0;
                        r = HEAP32[Rk + k >> 2] | 0;
                        u = ((r & 65535) + ((r13 & 65535) << 1) | 0) + c | 0;
                        w = ((r >>> 16) + (r13 >>> 16 << 1) | 0) + (u >>> 16) | 0;
                        HEAP32[Rk + k >> 2] = w << 16 | u & 65535;
                        c = w >>> 16;
                        k = k + 4 | 0;
                        r = HEAP32[Rk + k >> 2] | 0;
                        u = ((r & 65535) + ((r14 & 65535) << 1) | 0) + c | 0;
                        w = ((r >>> 16) + (r14 >>> 16 << 1) | 0) + (u >>> 16) | 0;
                        HEAP32[Rk + k >> 2] = w << 16 | u & 65535;
                        c = w >>> 16;
                        k = k + 4 | 0;
                        r = HEAP32[Rk + k >> 2] | 0;
                        u = ((r & 65535) + ((r15 & 65535) << 1) | 0) + c | 0;
                        w = ((r >>> 16) + (r15 >>> 16 << 1) | 0) + (u >>> 16) | 0;
                        HEAP32[Rk + k >> 2] = w << 16 | u & 65535;
                        h = w >>> 16;
                    }
                    for (k = k + 4 | 0; !!h & (k | 0) < dd << 1; k = k + 4 | 0) {
                        r = HEAP32[Rk + k >> 2] | 0;
                        u = (r & 65535) + h | 0;
                        w = (r >>> 16) + (u >>> 16) | 0;
                        HEAP32[Rk + k >> 2] = w << 16 | u & 65535;
                        h = w >>> 16;
                    }
                }
            }
        }
        function div(N, lN, D, lD, R, Q) {
            N = N | 0;
            lN = lN | 0;
            D = D | 0;
            lD = lD | 0;
            R = R | 0;
            Q = Q | 0;
            var n = 0, d = 0, e = 0, u1 = 0, u0 = 0, v0 = 0, vh = 0, vl = 0, qh = 0, ql = 0, rh = 0, rl = 0, t1 = 0, t2 = 0, m = 0, c = 0, i = 0, j = 0, k = 0;
            cp(lN, N, R);
            for (i = lN - 1 & -4; (i | 0) >= 0; i = i - 4 | 0) {
                n = HEAP32[N + i >> 2] | 0;
                if (n) {
                    lN = i;
                    break;
                }
            }
            for (i = lD - 1 & -4; (i | 0) >= 0; i = i - 4 | 0) {
                d = HEAP32[D + i >> 2] | 0;
                if (d) {
                    lD = i;
                    break;
                }
            }
            while ((d & 2147483648) == 0) {
                d = d << 1;
                e = e + 1 | 0;
            }
            u0 = HEAP32[N + lN >> 2] | 0;
            if (e) u1 = u0 >>> (32 - e | 0);
            for (i = lN - 4 | 0; (i | 0) >= 0; i = i - 4 | 0) {
                n = HEAP32[N + i >> 2] | 0;
                HEAP32[R + i + 4 >> 2] = u0 << e | (e ? n >>> (32 - e | 0) : 0);
                u0 = n;
            }
            HEAP32[R >> 2] = u0 << e;
            if (e) {
                v0 = HEAP32[D + lD >> 2] | 0;
                for (i = lD - 4 | 0; (i | 0) >= 0; i = i - 4 | 0) {
                    d = HEAP32[D + i >> 2] | 0;
                    HEAP32[D + i + 4 >> 2] = v0 << e | d >>> (32 - e | 0);
                    v0 = d;
                }
                HEAP32[D >> 2] = v0 << e;
            }
            v0 = HEAP32[D + lD >> 2] | 0;
            vh = v0 >>> 16, vl = v0 & 65535;
            for (i = lN; (i | 0) >= (lD | 0); i = i - 4 | 0) {
                j = i - lD | 0;
                u0 = HEAP32[R + i >> 2] | 0;
                qh = (u1 >>> 0) / (vh >>> 0) | 0, rh = (u1 >>> 0) % (vh >>> 0) | 0, t1 = imul(qh, vl) | 0;
                while ((qh | 0) == 65536 | t1 >>> 0 > (rh << 16 | u0 >>> 16) >>> 0) {
                    qh = qh - 1 | 0, rh = rh + vh | 0, t1 = t1 - vl | 0;
                    if ((rh | 0) >= 65536) break;
                }
                m = 0, c = 0;
                for (k = 0; (k | 0) <= (lD | 0); k = k + 4 | 0) {
                    d = HEAP32[D + k >> 2] | 0;
                    t1 = (imul(qh, d & 65535) | 0) + (m >>> 16) | 0;
                    t2 = (imul(qh, d >>> 16) | 0) + (t1 >>> 16) | 0;
                    d = m & 65535 | t1 << 16;
                    m = t2;
                    n = HEAP32[R + j + k >> 2] | 0;
                    t1 = ((n & 65535) - (d & 65535) | 0) + c | 0;
                    t2 = ((n >>> 16) - (d >>> 16) | 0) + (t1 >> 16) | 0;
                    HEAP32[R + j + k >> 2] = t2 << 16 | t1 & 65535;
                    c = t2 >> 16;
                }
                t1 = ((u1 & 65535) - (m & 65535) | 0) + c | 0;
                t2 = ((u1 >>> 16) - (m >>> 16) | 0) + (t1 >> 16) | 0;
                HEAP32[R + j + k >> 2] = u1 = t2 << 16 | t1 & 65535;
                c = t2 >> 16;
                if (c) {
                    qh = qh + 1 | 0, rh = rh - vh | 0;
                    c = 0;
                    for (k = 0; (k | 0) <= (lD | 0); k = k + 4 | 0) {
                        d = HEAP32[D + k >> 2] | 0;
                        n = HEAP32[R + j + k >> 2] | 0;
                        t1 = ((n & 65535) + (d & 65535) | 0) + c | 0;
                        t2 = ((n >>> 16) + (d >>> 16) | 0) + (t1 >>> 16) | 0;
                        HEAP32[R + j + k >> 2] = t2 << 16 | t1 & 65535;
                        c = t2 >>> 16;
                    }
                    HEAP32[R + j + k >> 2] = u1 = u1 + c | 0;
                }
                u0 = HEAP32[R + i >> 2] | 0;
                n = u1 << 16 | u0 >>> 16;
                ql = (n >>> 0) / (vh >>> 0) | 0, rl = (n >>> 0) % (vh >>> 0) | 0, t1 = imul(ql, vl) | 0;
                while ((ql | 0) == 65536 | t1 >>> 0 > (rl << 16 | u0 & 65535) >>> 0) {
                    ql = ql - 1 | 0, rl = rl + vh | 0, t1 = t1 - vl | 0;
                    if ((rl | 0) >= 65536) break;
                }
                m = 0, c = 0;
                for (k = 0; (k | 0) <= (lD | 0); k = k + 4 | 0) {
                    d = HEAP32[D + k >> 2] | 0;
                    t1 = (imul(ql, d & 65535) | 0) + (m & 65535) | 0;
                    t2 = ((imul(ql, d >>> 16) | 0) + (t1 >>> 16) | 0) + (m >>> 16) | 0;
                    d = t1 & 65535 | t2 << 16;
                    m = t2 >>> 16;
                    n = HEAP32[R + j + k >> 2] | 0;
                    t1 = ((n & 65535) - (d & 65535) | 0) + c | 0;
                    t2 = ((n >>> 16) - (d >>> 16) | 0) + (t1 >> 16) | 0;
                    c = t2 >> 16;
                    HEAP32[R + j + k >> 2] = t2 << 16 | t1 & 65535;
                }
                t1 = ((u1 & 65535) - (m & 65535) | 0) + c | 0;
                t2 = ((u1 >>> 16) - (m >>> 16) | 0) + (t1 >> 16) | 0;
                HEAP32[R + j + k >> 2] = u1 = t2 << 16 | t1 & 65535;
                c = t2 >> 16;
                if (c) {
                    ql = ql + 1 | 0, rl = rl + vh | 0;
                    c = 0;
                    for (k = 0; (k | 0) <= (lD | 0); k = k + 4 | 0) {
                        d = HEAP32[D + k >> 2] | 0;
                        n = HEAP32[R + j + k >> 2] | 0;
                        t1 = ((n & 65535) + (d & 65535) | 0) + c | 0;
                        t2 = ((n >>> 16) + (d >>> 16) | 0) + (t1 >>> 16) | 0;
                        c = t2 >>> 16;
                        HEAP32[R + j + k >> 2] = t1 & 65535 | t2 << 16;
                    }
                    HEAP32[R + j + k >> 2] = u1 + c | 0;
                }
                HEAP32[Q + j >> 2] = qh << 16 | ql;
                u1 = HEAP32[R + i >> 2] | 0;
            }
            if (e) {
                u0 = HEAP32[R >> 2] | 0;
                for (i = 4; (i | 0) <= (lD | 0); i = i + 4 | 0) {
                    n = HEAP32[R + i >> 2] | 0;
                    HEAP32[R + i - 4 >> 2] = n << (32 - e | 0) | u0 >>> e;
                    u0 = n;
                }
                HEAP32[R + lD >> 2] = u0 >>> e;
            }
        }
        function mredc(A, lA, N, lN, y, R) {
            A = A | 0;
            lA = lA | 0;
            N = N | 0;
            lN = lN | 0;
            y = y | 0;
            R = R | 0;
            var T = 0, t = 0, c = 0, uh = 0, ul = 0, vl = 0, vh = 0, w0 = 0, w1 = 0, w2 = 0, r0 = 0, r1 = 0, i = 0, j = 0, k = 0;
            T = salloc(lN << 1) | 0;
            z(lN << 1, 0, T);
            cp(lA, A, T);
            for (i = 0; (i | 0) < (lN | 0); i = i + 4 | 0) {
                t = HEAP32[T + i >> 2] | 0;
                uh = imul(t, y) | 0, ul = uh & 65535, uh = uh >>> 16;
                r1 = 0;
                for (j = 0; (j | 0) < (lN | 0); j = j + 4 | 0) {
                    k = i + j | 0;
                    vh = HEAP32[N + j >> 2] | 0, vl = vh & 65535, vh = vh >>> 16;
                    r0 = HEAP32[T + k >> 2] | 0;
                    w0 = ((imul(ul, vl) | 0) + (r1 & 65535) | 0) + (r0 & 65535) | 0;
                    w1 = ((imul(ul, vh) | 0) + (r1 >>> 16) | 0) + (r0 >>> 16) | 0;
                    w2 = ((imul(uh, vl) | 0) + (w1 & 65535) | 0) + (w0 >>> 16) | 0;
                    r1 = ((imul(uh, vh) | 0) + (w2 >>> 16) | 0) + (w1 >>> 16) | 0;
                    r0 = w2 << 16 | w0 & 65535;
                    HEAP32[T + k >> 2] = r0;
                }
                k = i + j | 0;
                r0 = HEAP32[T + k >> 2] | 0;
                w0 = ((r0 & 65535) + (r1 & 65535) | 0) + c | 0;
                w1 = ((r0 >>> 16) + (r1 >>> 16) | 0) + (w0 >>> 16) | 0;
                HEAP32[T + k >> 2] = w1 << 16 | w0 & 65535;
                c = w1 >>> 16;
            }
            cp(lN, T + lN | 0, R);
            sfree(lN << 1);
            if (c | (cmp(N, lN, R, lN) | 0) <= 0) {
                sub(R, lN, N, lN, R, lN) | 0;
            }
        }
        return {
            sreset: sreset,
            salloc: salloc,
            sfree: sfree,
            z: z,
            tst: tst,
            neg: neg,
            cmp: cmp,
            add: add,
            sub: sub,
            mul: mul,
            sqr: sqr,
            div: div,
            mredc: mredc
        };
    }
    function is_big_number(a) {
        return a instanceof BigNumber;
    }
    var _bigint_heap = new Uint32Array(1048576), _bigint_asm = bigint_asm(global, null, _bigint_heap.buffer);
    var _BigNumber_ZERO_limbs = new Uint32Array(0);
    function BigNumber(num) {
        var limbs = _BigNumber_ZERO_limbs, bitlen = 0, sign = 0;
        if (is_string(num)) num = string_to_bytes(num);
        if (is_buffer(num)) num = new Uint8Array(num);
        if (num === undefined) {} else if (is_number(num)) {
            var absnum = Math.abs(num);
            if (absnum > 4294967295) {
                limbs = new Uint32Array(2);
                limbs[0] = absnum | 0;
                limbs[1] = absnum / 4294967296 | 0;
                bitlen = 52;
            } else if (absnum > 0) {
                limbs = new Uint32Array(1);
                limbs[0] = absnum;
                bitlen = 32;
            } else {
                limbs = _BigNumber_ZERO_limbs;
                bitlen = 0;
            }
            sign = num < 0 ? -1 : 1;
        } else if (is_bytes(num)) {
            bitlen = num.length * 8;
            if (!bitlen) return BigNumber_ZERO;
            limbs = new Uint32Array(bitlen + 31 >> 5);
            for (var i = num.length - 4; i >= 0; i -= 4) {
                limbs[num.length - 4 - i >> 2] = num[i] << 24 | num[i + 1] << 16 | num[i + 2] << 8 | num[i + 3];
            }
            if (i === -3) {
                limbs[limbs.length - 1] = num[0];
            } else if (i === -2) {
                limbs[limbs.length - 1] = num[0] << 8 | num[1];
            } else if (i === -1) {
                limbs[limbs.length - 1] = num[0] << 16 | num[1] << 8 | num[2];
            }
            sign = 1;
        } else if (typeof num === "object" && num !== null) {
            limbs = new Uint32Array(num.limbs);
            bitlen = num.bitLength;
            sign = num.sign;
        } else {
            throw new TypeError("number is of unexpected type");
        }
        this.limbs = limbs;
        this.bitLength = bitlen;
        this.sign = sign;
    }
    function BigNumber_toString(radix) {
        radix = radix || 16;
        var limbs = this.limbs, bitlen = this.bitLength, str = "";
        if (radix === 16) {
            for (var i = (bitlen + 31 >> 5) - 1; i >= 0; i--) {
                var h = limbs[i].toString(16);
                str += "00000000".substr(h.length);
                str += h;
            }
            str = str.replace(/^0+/, "");
            if (!str.length) str = "0";
        } else {
            throw new IllegalArgumentError("bad radix");
        }
        if (this.sign < 0) str = "-" + str;
        return str;
    }
    function BigNumber_toBytes() {
        var bitlen = this.bitLength, limbs = this.limbs;
        if (bitlen === 0) return new uint8Array(0);
        var bytelen = bitlen + 7 >> 3, bytes = new Uint8Array(bytelen);
        for (var i = 0; i < bytelen; i++) {
            var j = bytelen - i - 1;
            bytes[i] = limbs[j >> 2] >> ((j & 3) << 3);
        }
        return bytes;
    }
    function BigNumber_valueOf() {
        var limbs = this.limbs, bits = this.bitLength, sign = this.sign;
        if (!sign) return 0;
        if (bits <= 32) return sign * (limbs[0] >>> 0);
        if (bits <= 52) return sign * (4294967296 * (limbs[1] >>> 0) + (limbs[0] >>> 0));
        var i, l, e = 0;
        for (i = limbs.length - 1; i >= 0; i--) {
            if ((l = limbs[i]) === 0) continue;
            while ((l << e & 2147483648) === 0) e++;
            break;
        }
        if (i === 0) return sign * (limbs[0] >>> 0);
        return sign * (1048576 * ((limbs[i] << e | (e ? limbs[i - 1] >>> 32 - e : 0)) >>> 0) + ((limbs[i - 1] << e | (e && i > 1 ? limbs[i - 2] >>> 32 - e : 0)) >>> 12)) * Math.pow(2, 32 * i - e - 52);
    }
    function BigNumber_clamp(b) {
        var limbs = this.limbs, bitlen = this.bitLength;
        if (b >= bitlen) return this;
        var clamped = new BigNumber(), n = b + 31 >> 5, k = b % 32;
        clamped.limbs = new Uint32Array(limbs.subarray(0, n));
        clamped.bitLength = b;
        clamped.sign = this.sign;
        if (k) clamped.limbs[n - 1] &= -1 >>> 32 - k;
        return clamped;
    }
    function BigNumber_splice(f, b) {
        var limbs = this.limbs, bitlen = this.bitLength;
        if (b === undefined) b = bitlen - f;
        if (f === 0) return this.clamp(b);
        var spliced = new BigNumber(), slimbs, n = f >> 5, m = f + b + 31 >> 5, t = (f - 1) % 32, k = b % 32;
        slimbs = new Uint32Array(limbs.subarray(n, m));
        spliced.limbs = slimbs;
        spliced.bitLength = b;
        spliced.sign = this.sign;
        if (t) {
            slimbs[0] >>>= t;
            for (var i = 1; i < slimbs.length; i++) {
                slimbs[i - 1] |= slimbs[i] << 32 - t;
                slimbs[i] >>>= t;
            }
        }
        if (k) {
            slimbs[m - n - 1] &= -1 >>> 32 - k;
        }
        return spliced;
    }
    function BigNumber_negate() {
        var negative = new BigNumber();
        negative.limbs = this.limbs;
        negative.bitLength = this.bitLength;
        negative.sign = -1 * this.sign;
        return negative;
    }
    function BigNumber_compare(that) {
        if (!is_big_number(that)) that = new BigNumber(that);
        var alimbs = this.limbs, alimbcnt = alimbs.length, blimbs = that.limbs, blimbcnt = blimbs.length, z = 0;
        if (this.sign < that.sign) return -1;
        if (this.sign > that.sign) return 1;
        _bigint_heap.set(alimbs, 0);
        _bigint_heap.set(blimbs, alimbcnt);
        z = _bigint_asm.cmp(0, alimbcnt << 2, alimbcnt << 2, blimbcnt << 2);
        return z * this.sign;
    }
    function BigNumber_add(that) {
        if (!is_big_number(that)) that = new BigNumber(that);
        if (!this.sign) return that;
        if (!that.sign) return this;
        var abitlen = this.bitLength, alimbs = this.limbs, alimbcnt = alimbs.length, asign = this.sign, bbitlen = that.bitLength, blimbs = that.limbs, blimbcnt = blimbs.length, bsign = that.sign, rbitlen, rlimbcnt, rsign, rof, result = new BigNumber();
        rbitlen = (abitlen > bbitlen ? abitlen : bbitlen) + 1;
        rlimbcnt = rbitlen + 31 >> 5;
        _bigint_asm.sreset();
        var pA = _bigint_asm.salloc(alimbcnt << 2), pB = _bigint_asm.salloc(blimbcnt << 2), pR = _bigint_asm.salloc(rlimbcnt << 2);
        _bigint_asm.z(pR - pA + (rlimbcnt << 2), 0, pA);
        _bigint_heap.set(alimbs, pA >> 2);
        _bigint_heap.set(blimbs, pB >> 2);
        if (asign * bsign > 0) {
            _bigint_asm.add(pA, alimbcnt << 2, pB, blimbcnt << 2, pR, rlimbcnt << 2);
            rsign = asign;
        } else if (asign > bsign) {
            rof = _bigint_asm.sub(pA, alimbcnt << 2, pB, blimbcnt << 2, pR, rlimbcnt << 2);
            rsign = rof ? bsign : asign;
        } else {
            rof = _bigint_asm.sub(pB, blimbcnt << 2, pA, alimbcnt << 2, pR, rlimbcnt << 2);
            rsign = rof ? asign : bsign;
        }
        if (rof) _bigint_asm.neg(pR, rlimbcnt << 2, pR, rlimbcnt << 2);
        if (_bigint_asm.tst(pR, rlimbcnt << 2) === 0) return BigNumber_ZERO;
        result.limbs = new Uint32Array(_bigint_heap.subarray(pR >> 2, (pR >> 2) + rlimbcnt));
        result.bitLength = rbitlen;
        result.sign = rsign;
        return result;
    }
    function BigNumber_subtract(that) {
        if (!is_big_number(that)) that = new BigNumber(that);
        return this.add(that.negate());
    }
    function BigNumber_multiply(that) {
        if (!is_big_number(that)) that = new BigNumber(that);
        if (!this.sign || !that.sign) return BigNumber_ZERO;
        var abitlen = this.bitLength, alimbs = this.limbs, alimbcnt = alimbs.length, bbitlen = that.bitLength, blimbs = that.limbs, blimbcnt = blimbs.length, rbitlen, rlimbcnt, result = new BigNumber();
        rbitlen = abitlen + bbitlen;
        rlimbcnt = rbitlen + 31 >> 5;
        _bigint_asm.sreset();
        var pA = _bigint_asm.salloc(alimbcnt << 2), pB = _bigint_asm.salloc(blimbcnt << 2), pR = _bigint_asm.salloc(rlimbcnt << 2);
        _bigint_asm.z(pR - pA + (rlimbcnt << 2), 0, pA);
        _bigint_heap.set(alimbs, pA >> 2);
        _bigint_heap.set(blimbs, pB >> 2);
        _bigint_asm.mul(pA, alimbcnt << 2, pB, blimbcnt << 2, pR, rlimbcnt << 2);
        result.limbs = new Uint32Array(_bigint_heap.subarray(pR >> 2, (pR >> 2) + rlimbcnt));
        result.sign = this.sign * that.sign;
        result.bitLength = rbitlen;
        return result;
    }
    function BigNumber_square() {
        if (!this.sign) return BigNumber_ZERO;
        var abitlen = this.bitLength, alimbs = this.limbs, alimbcnt = alimbs.length, rbitlen, rlimbcnt, result = new BigNumber();
        rbitlen = abitlen << 1;
        rlimbcnt = rbitlen + 31 >> 5;
        _bigint_asm.sreset();
        var pA = _bigint_asm.salloc(alimbcnt << 2), pR = _bigint_asm.salloc(rlimbcnt << 2);
        _bigint_asm.z(pR - pA + (rlimbcnt << 2), 0, pA);
        _bigint_heap.set(alimbs, pA >> 2);
        _bigint_asm.sqr(pA, alimbcnt << 2, pR);
        result.limbs = new Uint32Array(_bigint_heap.subarray(pR >> 2, (pR >> 2) + rlimbcnt));
        result.bitLength = rbitlen;
        result.sign = 1;
        return result;
    }
    function BigNumber_divide(that) {
        if (!is_big_number(that)) that = new BigNumber(that);
        var abitlen = this.bitLength, alimbs = this.limbs, alimbcnt = alimbs.length, bbitlen = that.bitLength, blimbs = that.limbs, blimbcnt = blimbs.length, qlimbcnt, rlimbcnt, quotient = BigNumber_ZERO, remainder = BigNumber_ZERO;
        _bigint_asm.sreset();
        var pA = _bigint_asm.salloc(alimbcnt << 2), pB = _bigint_asm.salloc(blimbcnt << 2), pR = _bigint_asm.salloc(blimbcnt << 2), pQ = _bigint_asm.salloc(alimbcnt << 2);
        _bigint_asm.z(pQ - pA + (alimbcnt << 2), 0, pA);
        _bigint_heap.set(alimbs, pA >> 2);
        _bigint_heap.set(blimbs, pB >> 2);
        _bigint_asm.div(pA, alimbcnt << 2, pB, blimbcnt << 2, pR, pQ);
        qlimbcnt = _bigint_asm.tst(pQ, alimbcnt << 2) >> 2;
        if (qlimbcnt) {
            quotient = new BigNumber();
            quotient.limbs = new Uint32Array(_bigint_heap.subarray(pQ >> 2, (pQ >> 2) + qlimbcnt));
            quotient.bitLength = abitlen < qlimbcnt << 5 ? abitlen : qlimbcnt << 5;
            quotient.sign = this.sign * that.sign;
        }
        rlimbcnt = _bigint_asm.tst(pR, blimbcnt << 2) >> 2;
        if (rlimbcnt) {
            remainder = new BigNumber();
            remainder.limbs = new Uint32Array(_bigint_heap.subarray(pR >> 2, (pR >> 2) + rlimbcnt));
            remainder.bitLength = bbitlen < rlimbcnt << 5 ? bbitlen : rlimbcnt << 5;
            remainder.sign = this.sign;
        }
        return {
            quotient: quotient,
            remainder: remainder
        };
    }
    var BigNumberPrototype = BigNumber.prototype = new Number();
    BigNumberPrototype.toString = BigNumber_toString;
    BigNumberPrototype.toBytes = BigNumber_toBytes;
    BigNumberPrototype.valueOf = BigNumber_valueOf;
    BigNumberPrototype.clamp = BigNumber_clamp;
    BigNumberPrototype.splice = BigNumber_splice;
    BigNumberPrototype.negate = BigNumber_negate;
    BigNumberPrototype.compare = BigNumber_compare;
    BigNumberPrototype.add = BigNumber_add;
    BigNumberPrototype.subtract = BigNumber_subtract;
    BigNumberPrototype.multiply = BigNumber_multiply;
    BigNumberPrototype.square = BigNumber_square;
    BigNumberPrototype.divide = BigNumber_divide;
    var BigNumber_ZERO = new BigNumber(0), BigNumber_ONE = new BigNumber(1);
    Object.freeze(BigNumber_ZERO);
    Object.freeze(BigNumber_ONE);
    function Number_extGCD(a, b) {
        var sa = a < 0 ? -1 : 1, sb = b < 0 ? -1 : 1, xi = 1, xj = 0, yi = 0, yj = 1, r, q, t, a_cmp_b;
        a *= sa;
        b *= sb;
        a_cmp_b = a < b;
        if (a_cmp_b) {
            t = a;
            a = b, b = t;
            t = sa;
            sa = sb;
            sb = t;
        }
        q = Math.floor(a / b), r = a - q * b;
        while (r) {
            t = xi - q * xj, xi = xj, xj = t;
            t = yi - q * yj, yi = yj, yj = t;
            a = b, b = r;
            q = Math.floor(a / b), r = a - q * b;
        }
        xj *= sa;
        yj *= sb;
        if (a_cmp_b) {
            t = xj;
            xj = yj, yj = t;
        }
        return {
            gcd: b,
            x: xj,
            y: yj
        };
    }
    function BigNumber_extGCD(a, b) {
        if (!is_big_number(a)) a = new BigNumber(a);
        if (!is_big_number(b)) b = new BigNumber(b);
        var sa = a.sign, sb = b.sign;
        if (sa < 0) a = a.negate();
        if (sb < 0) b = b.negate();
        var a_cmp_b = a.compare(b);
        if (a_cmp_b < 0) {
            var t = a;
            a = b, b = t;
            t = sa;
            sa = sb;
            sb = t;
        }
        var xi = BigNumber_ONE, xj = BigNumber_ZERO, lx = b.bitLength, yi = BigNumber_ZERO, yj = BigNumber_ONE, ly = a.bitLength, z, r, q;
        z = a.divide(b);
        while ((r = z.remainder) !== BigNumber_ZERO) {
            q = z.quotient;
            z = xi.subtract(q.multiply(xj).clamp(lx)).clamp(lx), xi = xj, xj = z;
            z = yi.subtract(q.multiply(yj).clamp(ly)).clamp(ly), yi = yj, yj = z;
            a = b, b = r;
            z = a.divide(b);
        }
        if (sa < 0) xj = xj.negate();
        if (sb < 0) yj = yj.negate();
        if (a_cmp_b < 0) {
            var t = xj;
            xj = yj, yj = t;
        }
        return {
            gcd: b,
            x: xj,
            y: yj
        };
    }
    function Modulus() {
        BigNumber.apply(this, arguments);
        if (this.valueOf() < 1) throw new RangeError();
        if (this.bitLength <= 32) return;
        var comodulus;
        if (this.limbs[0] & 1) {
            var bitlen = (this.bitLength + 31 & -32) + 1, limbs = new Uint32Array(bitlen + 31 >> 5);
            limbs[limbs.length - 1] = 1;
            comodulus = new BigNumber();
            comodulus.sign = 1;
            comodulus.bitLength = bitlen;
            comodulus.limbs = limbs;
            var k = Number_extGCD(4294967296, this.limbs[0]).y;
            this.coefficient = k < 0 ? -k : 4294967296 - k;
        } else {
            return;
        }
        this.comodulus = comodulus;
        this.comodulusRemainder = comodulus.divide(this).remainder;
        this.comodulusRemainderSquare = comodulus.square().divide(this).remainder;
    }
    function Modulus_reduce(a) {
        if (!is_big_number(a)) a = new BigNumber(a);
        if (a.bitLength <= 32 && this.bitLength <= 32) return new BigNumber(a.valueOf() % this.valueOf());
        if (a.bitLength < this.bitLength) {
            return a;
        } else if (a.bitLength === this.bitLength) {
            if (a.compare(this) < 0) return a;
            return a.subtract(this).clamp(this.bitLength);
        }
        return a.divide(this).remainder;
    }
    function Modulus_inverse(a) {
        a = this.reduce(a);
        var k = BigNumber_extGCD(this, a).y;
        if (k.sign < 0) k = k.add(this).clamp(this.bitLength);
        return k;
    }
    function Modulus_power(g, e) {
        if (!is_big_number(g)) g = new BigNumber(g);
        if (!is_big_number(e)) e = new BigNumber(e);
        var c = 0;
        for (var i = 0; i < e.limbs.length; i++) {
            var t = e.limbs[i];
            while (t) {
                if (t & 1) c++;
                t >>>= 1;
            }
        }
        var k = 8;
        if (e.bitLength <= 4536) k = 7;
        if (e.bitLength <= 1736) k = 6;
        if (e.bitLength <= 630) k = 5;
        if (e.bitLength <= 210) k = 4;
        if (e.bitLength <= 60) k = 3;
        if (e.bitLength <= 12) k = 2;
        if (c <= 1 << k - 1) k = 1;
        g = _Montgomery_reduce(this.reduce(g).multiply(this.comodulusRemainderSquare), this);
        var g2 = _Montgomery_reduce(g.square(), this), gn = new Array(1 << k - 1);
        gn[0] = g;
        gn[1] = _Montgomery_reduce(g.multiply(g2), this);
        for (var i = 2; i < 1 << k - 1; i++) {
            gn[i] = _Montgomery_reduce(gn[i - 1].multiply(g2), this);
        }
        var r = BigNumber_ONE;
        for (var i = e.limbs.length - 1; i >= 0; i--) {
            var t = e.limbs[i];
            for (var j = 32; j > 0; ) {
                if (t & 2147483648) {
                    var n = t >>> 32 - k, l = k;
                    while ((n & 1) === 0) {
                        n >>>= 1;
                        l--;
                    }
                    var m = gn[n >>> 1];
                    while (n) {
                        n >>>= 1;
                        r = r !== BigNumber_ONE ? _Montgomery_reduce(r.square(), this) : r;
                    }
                    r = r !== BigNumber_ONE ? _Montgomery_reduce(r.multiply(m), this) : m;
                    t <<= l;
                    j -= l;
                } else {
                    r = r !== BigNumber_ONE ? _Montgomery_reduce(r.square(), this) : r;
                    t <<= 1;
                    j--;
                }
            }
        }
        r = _Montgomery_reduce(r, this);
        return r;
    }
    function _Montgomery_reduce(a, n) {
        var alimbs = a.limbs, alimbcnt = alimbs.length, nlimbs = n.limbs, nlimbcnt = nlimbs.length, y = n.coefficient;
        _bigint_asm.sreset();
        var pA = _bigint_asm.salloc(alimbcnt << 2), pN = _bigint_asm.salloc(nlimbcnt << 2), pR = _bigint_asm.salloc(nlimbcnt << 2);
        _bigint_asm.z(pR - pA + (nlimbcnt << 2), 0, pA);
        _bigint_heap.set(alimbs, pA >> 2);
        _bigint_heap.set(nlimbs, pN >> 2);
        _bigint_asm.mredc(pA, alimbcnt << 2, pN, nlimbcnt << 2, y, pR);
        var result = new BigNumber();
        result.limbs = new Uint32Array(_bigint_heap.subarray(pR >> 2, (pR >> 2) + nlimbcnt));
        result.bitLength = n.bitLength;
        result.sign = 1;
        return result;
    }
    var ModulusPrototype = Modulus.prototype = new BigNumber();
    ModulusPrototype.reduce = Modulus_reduce;
    ModulusPrototype.inverse = Modulus_inverse;
    ModulusPrototype.power = Modulus_power;
    function BigNumber_isProbablePrime(paranoia) {
        paranoia = paranoia || 100;
        var limbs = this.limbs, i = 0;
        if ((limbs[0] & 1) === 0) return false;
        if (paranoia <= 1) return true;
        var s3 = 0, s5 = 0, s17 = 0;
        for (i = 0; i < limbs.length; i++) {
            var l3 = limbs[i];
            while (l3) {
                s3 += l3 & 3;
                l3 >>>= 2;
            }
            var l5 = limbs[i];
            while (l5) {
                s5 += l5 & 3;
                l5 >>>= 2;
                s5 -= l5 & 3;
                l5 >>>= 2;
            }
            var l17 = limbs[i];
            while (l17) {
                s17 += l17 & 15;
                l17 >>>= 4;
                s17 -= l17 & 15;
                l17 >>>= 4;
            }
        }
        if (!(s3 % 3) || !(s5 % 5) || !(s17 % 17)) return false;
        if (paranoia <= 2) return true;
        var t = new BigNumber(this), s = 0;
        t.limbs[0] -= 1;
        while (t.limbs[s >> 5] === 0) s += 32;
        while ((t.limbs[s >> 5] >> (s & 31) & 1) === 0) s++;
        t = t.splice(s + 1);
        var m = new Modulus(this), m1 = this.subtract(BigNumber_ONE), a = new BigNumber(this), l = this.limbs.length - 1;
        while (a.limbs[l] === 0) l--;
        paranoia >>>= 1;
        while (--paranoia >= 0) {
            Random_getBytes(a.limbs.buffer);
            if (a.limbs[0] < 2) a.limbs[0] += 2;
            while (a.compare(m1) >= 0) a.limbs[l] >>>= 1;
            var x = m.power(a, t);
            if (x.compare(BigNumber_ONE) === 0) continue;
            if (x.compare(m1) === 0) continue;
            var c = s;
            while (--c > 0) {
                x = x.square().divide(m).remainder;
                if (x.compare(BigNumber_ONE) === 0) return false;
                if (x.compare(m1) === 0) break;
            }
            if (c === 0) return false;
        }
        return true;
    }
    BigNumberPrototype.isProbablePrime = BigNumber_isProbablePrime;
    BigNumber.ZERO = BigNumber_ZERO;
    BigNumber.ONE = BigNumber_ONE;
    BigNumber.extGCD = BigNumber_extGCD;
    exports.BigNumber = BigNumber;
    exports.Modulus = Modulus;
    function RSA(options) {
        options = options || {};
        this.key = null;
        this.result = null;
        this.reset(options);
    }
    function RSA_reset(options) {
        options = options || {};
        this.result = null;
        var key = options.key;
        if (key !== undefined) {
            if (key instanceof Array) {
                var l = key.length;
                if (l !== 2 && l !== 3 && l !== 8) throw new SyntaxError("unexpected key type");
                var k = [];
                k[0] = new Modulus(key[0]);
                k[1] = new BigNumber(key[1]);
                if (l > 2) {
                    k[2] = new BigNumber(key[2]);
                }
                if (l > 3) {
                    k[3] = new Modulus(key[3]);
                    k[4] = new Modulus(key[4]);
                    k[5] = new BigNumber(key[5]);
                    k[6] = new BigNumber(key[6]);
                    k[7] = new BigNumber(key[7]);
                }
                this.key = k;
            } else {
                throw new TypeError("unexpected key type");
            }
        }
        return this;
    }
    function RSA_encrypt(data) {
        if (!this.key) throw new IllegalStateError("no key is associated with the instance");
        if (is_string(data)) data = string_to_bytes(data);
        if (is_buffer(data)) data = new Uint8Array(data);
        var msg;
        if (is_bytes(data)) {
            msg = new BigNumber(data);
        } else if (is_big_number(data)) {
            msg = data;
        } else {
            throw new TypeError("unexpected data type");
        }
        if (this.key[0].compare(msg) <= 0) throw new RangeError("data too large");
        this.result = this.key[0].power(msg, this.key[1]).toBytes();
        return this;
    }
    function RSA_decrypt(data) {
        if (!this.key) throw new IllegalStateError("no key is associated with the instance");
        if (this.key.length < 3) throw new IllegalStateError("key isn't suitable for decription");
        if (is_string(data)) data = string_to_bytes(data);
        if (is_buffer(data)) data = new Uint8Array(data);
        var msg;
        if (is_bytes(data)) {
            msg = new BigNumber(data);
        } else if (is_big_number(data)) {
            msg = data;
        } else {
            throw new TypeError("unexpected data type");
        }
        if (this.key[0].compare(msg) <= 0) throw new RangeError("data too large");
        if (this.key.length > 3) {
            var m = this.key[0], d = this.key[2], p = this.key[3], q = this.key[4], dp = this.key[5], dq = this.key[6], u = this.key[7];
            var x = p.power(msg, dp), y = q.power(msg, dq);
            var t = x.subtract(y);
            if (t.sign < 0) t = t.add(p);
            var h = p.reduce(u.multiply(t));
            this.result = h.multiply(q).add(y).clamp(m.bitLength).toBytes();
        } else {
            var m = this.key[0], d = this.key[2];
            this.result = m.power(msg, d).toBytes();
        }
        return this;
    }
    var RSA_prototype = RSA.prototype;
    RSA_prototype.reset = RSA_reset;
    RSA_prototype.encrypt = RSA_encrypt;
    RSA_prototype.decrypt = RSA_decrypt;
    function RSA_generateKey(bitlen, e) {
        bitlen = bitlen || 2048;
        e = e || 65537;
        if (bitlen < 512) throw new IllegalArgumentError("bit length is too small");
        if (pow2_ceil(bitlen) !== bitlen) throw new IllegalArgumentError("bit length should be a power of 2");
        var limbcnt = (bitlen >> 1) + 31 >> 5;
        var p = new BigNumber();
        p.sign = 1;
        p.bitLength = bitlen >> 1;
        p.limbs = new Uint32Array(limbcnt);
        while (true) {
            Random_getBytes(p.limbs.buffer);
            p.limbs[0] |= 1;
            p.limbs[limbcnt - 1] &= pow2_ceil(bitlen >> 1 & 31) - 1;
            if (p.isProbablePrime(100)) break;
        }
        var p1 = new BigNumber(p);
        p1.limbs[0] ^= 1;
        var q = new BigNumber();
        q.sign = 1;
        q.bitLength = bitlen >> 1;
        q.limbs = new Uint32Array(limbcnt);
        while (true) {
            Random_getBytes(q.limbs.buffer);
            q.limbs[0] |= 1;
            q.limbs[limbcnt - 1] &= pow2_ceil(bitlen >> 1 & 31) - 1;
            if (q.isProbablePrime(100)) break;
        }
        var q1 = new BigNumber(q);
        q1.limbs[0] ^= 1;
        var m = new Modulus(p.multiply(q));
        var d = m.inverse(e);
        var dp = d.divide(p1).remainder, dq = d.divide(q1).remainder;
        p = new Modulus(p), q = new Modulus(q);
        var u = p.inverse(q);
        return [ m, e, d, p, q, dp, dq, u ];
    }
    RSA.generateKey = RSA_generateKey;
    function RSA_OAEP(options) {
        options = options || {};
        if (!options.hash) throw new SyntaxError("option 'hash' is required");
        if (!options.hash.HASH_SIZE) throw new SyntaxError("option 'hash' supplied doesn't seem to be a valid hash function");
        this.hash = options.hash;
        this.label = null;
        this.reset(options);
    }
    function RSA_OAEP_reset(options) {
        options = options || {};
        var label = options.label;
        if (label !== undefined) {
            if (is_buffer(label) || is_bytes(label)) {
                label = new Uint8Array(label);
            } else if (is_string(label)) {
                var str = label;
                label = new Uint8Array(str.length);
                for (var i = 0; i < str.length; i++) label[i] = str.charCodeAt(i);
            } else {
                throw new TypeError("unexpected label type");
            }
            this.label = label.length > 0 ? label : null;
        } else {
            this.label = null;
        }
        RSA_reset.call(this, options);
    }
    function RSA_OAEP_encrypt(data) {
        if (!this.key) throw new IllegalStateError("no key is associated with the instance");
        var key_size = Math.ceil(this.key[0].bitLength / 8), hash_size = this.hash.HASH_SIZE, data_length = data.byteLength || data.length || 0, ps_length = key_size - data_length - 2 * hash_size - 2;
        if (data_length > key_size - 2 * this.hash.HASH_SIZE - 2) throw new IllegalArgumentError("data too large");
        var message = new Uint8Array(key_size), seed = message.subarray(1, hash_size + 1), data_block = message.subarray(hash_size + 1);
        if (is_bytes(data)) {
            data_block.set(data, hash_size + ps_length + 1);
        } else if (is_buffer(data)) {
            data_block.set(new Uint8Array(data), hash_size + ps_length + 1);
        } else if (is_string(data)) {
            for (var i = 0; i < data.length; i++) data_block[key_size + ps_length + 1 + i] = data.charCodeAt(i);
        } else {
            throw new TypeError("unexpected data type");
        }
        data_block.set(this.hash.reset().process(this.label || "").finish().result, 0);
        data_block[hash_size + ps_length] = 1;
        Random_getBytes.call(this, seed);
        var data_block_mask = RSA_MGF1_generate.call(this, seed, data_block.length);
        for (var i = 0; i < data_block.length; i++) data_block[i] ^= data_block_mask[i];
        var seed_mask = RSA_MGF1_generate.call(this, data_block, seed.length);
        for (var i = 0; i < seed.length; i++) seed[i] ^= seed_mask[i];
        RSA_encrypt.call(this, message);
        return this;
    }
    function RSA_OAEP_decrypt(data) {
        if (!this.key) throw new IllegalStateError("no key is associated with the instance");
        var key_size = Math.ceil(this.key[0].bitLength / 8), hash_size = this.hash.HASH_SIZE, data_length = data.byteLength || data.length || 0;
        if (data_length !== key_size) throw new IllegalArgumentError("bad data");
        RSA_decrypt.call(this, data);
        var z = this.result[0], seed = this.result.subarray(1, hash_size + 1), data_block = this.result.subarray(hash_size + 1);
        if (z !== 0) throw new SecurityError("decryption failed");
        var seed_mask = RSA_MGF1_generate.call(this, data_block, seed.length);
        for (var i = 0; i < seed.length; i++) seed[i] ^= seed_mask[i];
        var data_block_mask = RSA_MGF1_generate.call(this, seed, data_block.length);
        for (var i = 0; i < data_block.length; i++) data_block[i] ^= data_block_mask[i];
        var lhash = this.hash.reset().process(this.label || "").finish().result;
        for (var i = 0; i < hash_size; i++) {
            if (lhash[i] !== data_block[i]) throw new SecurityError("decryption failed");
        }
        var ps_end = hash_size;
        for (;ps_end < data_block.length; ps_end++) {
            var psz = data_block[ps_end];
            if (psz === 1) break;
            if (psz !== 0) throw new SecurityError("decryption failed");
        }
        if (ps_end === data_block.length) throw new SecurityError("decryption failed");
        this.result = data_block.subarray(ps_end + 1);
        return this;
    }
    function RSA_MGF1_generate(seed, length) {
        seed = seed || "";
        length = length || 0;
        var hash_size = this.hash.HASH_SIZE;
        var mask = new Uint8Array(length), counter = new Uint8Array(4), chunks = Math.ceil(length / hash_size);
        for (var i = 0; i < chunks; i++) {
            counter[0] = i >>> 24, counter[1] = i >>> 16 & 255, counter[2] = i >>> 8 & 255, 
            counter[3] = i & 255;
            var submask = mask.subarray(i * hash_size);
            var chunk = this.hash.reset().process(seed).process(counter).finish().result;
            if (chunk.length > submask.length) chunk = chunk.subarray(0, submask.length);
            submask.set(chunk);
        }
        return mask;
    }
    function RSA_PSS(options) {
        options = options || {};
        if (!options.hash) throw new SyntaxError("option 'hash' is required");
        if (!options.hash.HASH_SIZE) throw new SyntaxError("option 'hash' supplied doesn't seem to be a valid hash function");
        this.hash = options.hash;
        this.saltLength = 4;
        this.reset(options);
    }
    function RSA_PSS_reset(options) {
        options = options || {};
        RSA_reset.call(this, options);
        var slen = options.saltLength;
        if (slen !== undefined) {
            if (!is_number(slen) || slen < 0) throw new TypeError("saltLength should be a non-negative number");
            if (this.key !== null && Math.ceil((this.key[0].bitLength - 1) / 8) < this.hash.HASH_SIZE + slen + 2) throw new SyntaxError("saltLength is too large");
            this.saltLength = slen;
        } else {
            this.saltLength = 4;
        }
    }
    function RSA_PSS_sign(data) {
        if (!this.key) throw new IllegalStateError("no key is associated with the instance");
        var key_bits = this.key[0].bitLength, hash_size = this.hash.HASH_SIZE, message_length = Math.ceil((key_bits - 1) / 8), salt_length = this.saltLength, ps_length = message_length - salt_length - hash_size - 2;
        var message = new Uint8Array(message_length), h_block = message.subarray(message_length - hash_size - 1, message_length - 1), d_block = message.subarray(0, message_length - hash_size - 1), d_salt = d_block.subarray(ps_length + 1);
        var m_block = new Uint8Array(8 + hash_size + salt_length), m_hash = m_block.subarray(8, 8 + hash_size), m_salt = m_block.subarray(8 + hash_size);
        m_hash.set(this.hash.reset().process(data).finish().result);
        if (salt_length > 0) Random_getBytes.call(this, m_salt);
        d_block[ps_length] = 1;
        d_salt.set(m_salt);
        h_block.set(this.hash.reset().process(m_block).finish().result);
        var d_block_mask = RSA_MGF1_generate.call(this, h_block, d_block.length);
        for (var i = 0; i < d_block.length; i++) d_block[i] ^= d_block_mask[i];
        message[message_length - 1] = 188;
        var zbits = 8 * message_length - key_bits + 1;
        if (zbits % 8) message[0] &= 255 >>> zbits;
        RSA_decrypt.call(this, message);
        return this;
    }
    function RSA_PSS_verify(signature, data) {
        if (!this.key) throw new IllegalStateError("no key is associated with the instance");
        var key_bits = this.key[0].bitLength, hash_size = this.hash.HASH_SIZE, message_length = Math.ceil((key_bits - 1) / 8), salt_length = this.saltLength, ps_length = message_length - salt_length - hash_size - 2;
        RSA_encrypt.call(this, signature);
        var message = this.result;
        if (message[message_length - 1] !== 188) throw new SecurityError("bad signature");
        var h_block = message.subarray(message_length - hash_size - 1, message_length - 1), d_block = message.subarray(0, message_length - hash_size - 1), d_salt = d_block.subarray(ps_length + 1);
        var zbits = 8 * message_length - key_bits + 1;
        if (zbits % 8 && message[0] >>> 8 - zbits) throw new SecurityError("bad signature");
        var d_block_mask = RSA_MGF1_generate.call(this, h_block, d_block.length);
        for (var i = 0; i < d_block.length; i++) d_block[i] ^= d_block_mask[i];
        if (zbits % 8) message[0] &= 255 >>> zbits;
        for (var i = 0; i < ps_length; i++) {
            if (d_block[i] !== 0) throw new SecurityError("bad signature");
        }
        if (d_block[ps_length] !== 1) throw new SecurityError("bad signature");
        var m_block = new Uint8Array(8 + hash_size + salt_length), m_hash = m_block.subarray(8, 8 + hash_size), m_salt = m_block.subarray(8 + hash_size);
        m_hash.set(this.hash.reset().process(data).finish().result);
        m_salt.set(d_salt);
        var h_block_verify = this.hash.reset().process(m_block).finish().result;
        for (var i = 0; i < hash_size; i++) {
            if (h_block[i] !== h_block_verify[i]) throw new SecurityError("bad signature");
        }
        return this;
    }
    var RSA_OAEP_prototype = RSA_OAEP.prototype;
    RSA_OAEP_prototype.reset = RSA_OAEP_reset;
    RSA_OAEP_prototype.encrypt = RSA_OAEP_encrypt;
    RSA_OAEP_prototype.decrypt = RSA_OAEP_decrypt;
    var RSA_PSS_prototype = RSA_PSS.prototype;
    RSA_PSS_prototype.reset = RSA_PSS_reset;
    RSA_PSS_prototype.sign = RSA_PSS_sign;
    RSA_PSS_prototype.verify = RSA_PSS_verify;
    function rsa_generate_key(bitlen, e) {
        if (bitlen === undefined) throw new SyntaxError("bitlen required");
        if (e === undefined) throw new SyntaxError("e required");
        var key = RSA_generateKey(bitlen, e);
        for (var i = 0; i < key.length; i++) {
            if (is_big_number(key[i])) key[i] = key[i].toBytes();
        }
        return key;
    }
    exports.RSA = {
        generateKey: rsa_generate_key
    };
    function rsa_oaep_sha256_encrypt_bytes(data, key, label) {
        if (data === undefined) throw new SyntaxError("data required");
        if (key === undefined) throw new SyntaxError("key required");
        return new RSA_OAEP({
            hash: SHA256_instance,
            key: key,
            label: label
        }).encrypt(data).result;
    }
    function rsa_oaep_sha256_decrypt_bytes(data, key, label) {
        if (data === undefined) throw new SyntaxError("data required");
        if (key === undefined) throw new SyntaxError("key required");
        return new RSA_OAEP({
            hash: SHA256_instance,
            key: key,
            label: label
        }).decrypt(data).result;
    }
    exports.RSA_OAEP_SHA256 = {
        encrypt: rsa_oaep_sha256_encrypt_bytes,
        decrypt: rsa_oaep_sha256_decrypt_bytes
    };
    function rsa_pss_sha256_sign_bytes(data, key, slen) {
        if (data === undefined) throw new SyntaxError("data required");
        if (key === undefined) throw new SyntaxError("key required");
        return new RSA_PSS({
            hash: SHA256_instance,
            key: key,
            saltLength: slen
        }).sign(data).result;
    }
    function rsa_pss_sha256_verify_bytes(signature, data, key, slen) {
        if (signature === undefined) throw new SyntaxError("signature required");
        if (data === undefined) throw new SyntaxError("data required");
        if (key === undefined) throw new SyntaxError("key required");
        try {
            new RSA_PSS({
                hash: SHA256_instance,
                key: key,
                saltLength: slen
            }).verify(signature, data);
            return true;
        } catch (e) {
            if (!(e instanceof SecurityError)) throw e;
        }
        return false;
    }
    exports.RSA_PSS_SHA256 = {
        sign: rsa_pss_sha256_sign_bytes,
        verify: rsa_pss_sha256_verify_bytes
    };
})({}, function() {
    return this;
}());
//# sourceMappingURL=asmcrypto.map