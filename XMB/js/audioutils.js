const AudioUtils = (() => {
  function writeBytes(path, bytes) {
    const fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC);
    if (fd < 0) { return false; }
    os.write(fd, bytes.buffer, bytes.byteOffset, bytes.byteLength);
    os.close(fd);
    return true;
  }
  function sanitizeMP3(path) {
    let fd = os.open(path, os.O_RDONLY);
    if (!fd) { return { path, temp:false, data:new Uint8Array(0), start:0, sr:0 }; }
    const size = os.seek(fd, 0, std.SEEK_END);
    os.seek(fd, 0, std.SEEK_SET);
    let start = 0;
    let hdr = new ArrayBuffer(10);
    os.read(fd, hdr, 0, 10);
    const hv = new Uint8Array(hdr);
    if (hv[0] === 0x49 && hv[1] === 0x44 && hv[2] === 0x33) {
      const sz = ((hv[6]&127)<<21)|((hv[7]&127)<<14)|((hv[8]&127)<<7)|(hv[9]&127);
      start = 10 + sz;
    }
    let sr = 0;
    let found = false;
    // Optimized: Use smaller chunks (32KB instead of 64KB) for PS2's limited memory
    const CHUNK = 32768;
    const buf = new ArrayBuffer(CHUNK);
    const tmp = new Uint8Array(buf);
    let pos = start;
    // Optimized: Reduce scan limit (128KB instead of 256KB) for faster processing on PS2
    const scanLimit = Math.min(size, start + 131072);
    while (pos < scanLimit) {
      os.seek(fd, pos, std.SEEK_SET);
      const rem = Math.min(CHUNK, size - pos);
      const r = os.read(fd, buf, 0, rem);
      if (r <= 4) { break; }
      // Optimized: Check every 2 bytes instead of every byte for faster scanning
      for (let i = 0; i < r - 4; i += 2) {
        const b0 = tmp[i], b1 = tmp[i+1], b2 = tmp[i+2], b3 = tmp[i+3];
        if (b0 === 0xFF && (b1 & 0xE0) === 0xE0) {
          const ver = (b1 >> 3) & 3;
          const layer = (b1 >> 1) & 3;
          const br = (b2 >> 4) & 15;
          const srIdx = (b2 >> 2) & 3;
          if (ver !== 1 && layer !== 0 && br !== 0 && br !== 15 && srIdx !== 3) {
            start = pos + i;
            const tbl = { 3:[44100,48000,32000], 2:[22050,24000,16000], 0:[11025,12000,8000] };
            const srList = tbl[ver];
            sr = srList ? (srList[srIdx]||0) : 0;
            found = true;
            break;
          }
        }
      }
      if (found) { break; }
      pos += r;
    }
    let end = size;
    if (size > 32) {
      os.seek(fd, size - 32, std.SEEK_SET);
      const tail = new ArrayBuffer(32);
      os.read(fd, tail, 0, 32);
      const dv = new DataView(tail);
      let sig = "";
      for (let i = 0; i < 8; i++) { sig += String.fromCharCode(dv.getUint8(i)); }
      if (sig === "APETAGEX") {
        const tsize = dv.getUint32(12, true);
        if (tsize > 0 && tsize < size) { end = size - tsize; }
      }
    }
    const root = getRootName(path);
    const tmpDir = `${root}:/__osdxmb_tmp/`;
    if (!std.exists(tmpDir)) { os.mkdir(tmpDir); }
    const out = `${tmpDir}${getFileName(path)}.clean.mp3`;
    const wfd = os.open(out, os.O_WRONLY | os.O_CREAT | os.O_TRUNC);
    if (!wfd) { os.close(fd); return { path, temp:false, data:new Uint8Array(0), start:start, sr:sr }; }
    // Optimized: Use same CHUNK size (32KB) for copying to reduce memory usage
    let copyPos = start;
    const cpBuf = new ArrayBuffer(CHUNK);
    while (copyPos < end) {
      os.seek(fd, copyPos, std.SEEK_SET);
      const n = Math.min(CHUNK, end - copyPos);
      const rr = os.read(fd, cpBuf, 0, n);
      if (rr <= 0) { break; }
      os.write(wfd, cpBuf, 0, rr);
      copyPos += rr;
      // Optimized: Yield control periodically to prevent UI freezing on PS2
      if ((copyPos - start) % (CHUNK * 4) === 0) {
        os.sleep(1);
      }
    }
    os.close(wfd);
    os.close(fd);
    return { path: out, temp:true, data:new Uint8Array(0), start:0, sr:sr };
  }
  function probeWavSampleRate(path) {
    const fd = os.open(path, os.O_RDONLY);
    if (!fd) { return 0; }
    const hdr = new ArrayBuffer(28);
    os.read(fd, hdr, 0, 28);
    os.close(fd);
    const dv = new DataView(hdr);
    return dv.getUint32(24, true);
  }
  function prepareForPlayback(path) {
    const ext = getFileExtension(path).toLowerCase();
    let pitch = 1.0;
    if (ext === "mp3") {
      const s = sanitizeMP3(path);
      const sr = s.sr;
      if (sr > 44100) { pitch = 44100 / sr; }
      return { path: s.path, pitch, temp: s.temp, unsupported: true };
    }
    if (ext === "wav") {
      const sr = probeWavSampleRate(path);
      if (sr > 44100) { pitch = 44100 / sr; }
      return { path, pitch, temp:false };
    }
    return { path, pitch:1.0, temp:false };
  }
  function cleanupTemp(tempPath, originalPath) {
    if (tempPath !== originalPath) { try { os.remove(tempPath); } catch (e) {} }
  }
  return { prepareForPlayback, cleanupTemp };
})();
