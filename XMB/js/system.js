//////////////////////////////////////////////////////////////////////////
///*				   			  System						  	  *///
/// 				   		  										   ///
///		 The module where all generic functions and variables are 	   ///
///			   			   generated and stored. 					   ///
/// 				   		  										   ///
//////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////
///*				   			 Explorer							  *///
//////////////////////////////////////////////////////////////////////////

function umountHDD() { if (os.readdir("pfs1:/")[1] === 0) { System.umount("pfs1:"); } }
function mountHDDPartition(partName) {
    if (!UserConfig.HDD) { return "?"; }

	umountHDD();
	const result = System.mount("pfs1:", `hdd0:${partName}`);
	xlog(`Partition "${partName}" Mount process finished with result: ${result}`);

	switch (result) {
        case 0: break; // This partition was mounted correctly.
        case -16: return "pfs0"; // The partition was already mounted on pfs0 probably.
	}

	return "pfs1";
}
function getAvailableDevices() {
    const Elements = [];
    const devices = System.devices();

    Elements.push({
        Name: XMBLANG.WORK_DIR_NAME,
        Description: "",
        Icon: 18,
        Type: "SUBMENU",
        Root: CWD
    });

    for (let i = 0; i < devices.length; i++) {
        let dev = devices[i];

        let count = 0;
        let basepath = "";
        let nameList = [];
        let descList = [];
        let iconList = [];

        switch (dev.name) {
            case "mc":
                count = 0;
                basepath = "mc";
                for (let j = 0; j < 2; j++) {
                    const mcInfo = System.getMCInfo(j);
                    if (!mcInfo || mcInfo.freemem === undefined) {
                        continue;
                    }

                    const free = mcInfo.freemem;
                    let totalKb;
                    if (free >= 58000)      totalKb = 65536;
                    else if (free >= 29000) totalKb = 32768;
                    else if (free >= 14500) totalKb = 16384;
                    else                    totalKb = 8192;

                    const usedKb = Math.min(Math.max(totalKb - free, 0), totalKb);
                    const usedMb = (usedKb / 1024).toFixed(1);
                    const totalMb = (totalKb / 1024).toFixed(0);

                    nameList.push(`Memory Card ${(j + 1)}`);
                    descList.push(`${usedMb} / ${totalMb} MB`);
                    iconList.push(16 + j);
                    count++;
                }
                break;
            case "mass":
                count = 0;
                basepath = "mass";
                for (let j = 0; j < 10; j++) {
                    const root = `mass${j.toString()}:`;
                    let dir = null;
                    try { dir = os.readdir(root)[0]; } catch (e) { break; }
                    if (!dir || dir.length === 0) { break; }
                    nameList.push(XMBLANG.MASS_DIR_NAME);
                    iconList.push(21);
                    let desc = "";
                    try {
                        const info = System.getBDMInfo(root);
                        if (info && info.name) {
                            let bdmName = info.name;
                            switch (info.name) {
                                case "sdc": bdmName = "mx4sio"; break;
                                case "sd": bdmName = "ilink"; break;
                                case "udp": bdmName = "udpbd"; break;
                            }
                            desc = `${bdmName.toUpperCase()} ${(info.index + 1).toString()}`;
                        } else {
                            desc = `USB ${(j + 1).toString()}`;
                        }
                    } catch (e) {
                        desc = `USB ${(j + 1).toString()}`;
                    }
                    descList.push(desc);
                    count++;
                }
                break;
            case "hdd":
                count = 1;
                basepath = "hdd";
                nameList.push(XMBLANG.HDD_DIR_NAME);
                descList.push("");
                iconList.push(29);
                break;
            case "mmce":
                count = 2;
                basepath = "mmce";
                for (let j = 0; j < count; j++) {
                    nameList.push("MMCE " + (j + 1).toString());
                    descList.push(XMBLANG.MMCE_DESC);
                    iconList.push(21);
                }
                break;
        }

        for (let j = 0; j < count; j++) {
            const root = `${basepath}${j.toString()}:`;
            let ok = false;
            try { const dir = os.readdir(root)[0]; ok = !!dir && dir.length > 0; } catch (e) { ok = false; }
            if (ok) {
                Elements.push({
                    Name: nameList[j],
                    Description: descList[j],
                    Icon: iconList[j],
                    Type: "SUBMENU",
                    Root: root
                });
            }
        }
    }

    return Elements;
}
function getDevicesAsItems(params = {}) {
	const Items = [];
	const fileFilters = ('fileFilters' in params) ? params.fileFilters : false;
	const fileoptions = ('fileoptions' in params) ? params.fileoptions : false;

    for (let i = 0; i < gDevices.length; i++) {
        Items.push({ ...gDevices[i] });
        Object.defineProperty(Items[Items.length - 1], "Value", {
            get() { return exploreDir({ dir: this.Root, fileFilters: fileFilters, fileoptions: fileoptions }); },
            enumerable: true,
            configurable: true,
        });
	}
	return Items;
}
function exploreDir(params) {
	const fileFilters = ('fileFilters' in params) ? params.fileFilters : false;
	const fileoptions = ('fileoptions' in params) ? params.fileoptions : false;
	const collection = [];
	const isHdd = (params.dir.substring(0,3) === "hdd");
	const isMc = (params.dir.substring(0,2) === "mc");
    let dirItems = [];
    try { dirItems = System.listDir(params.dir); } catch (e) { return { Items: [], Default: 0 }; }

    // Separate directories and files
    let directories = dirItems.filter(item => item.name !== "." && item.name !== ".." && item.dir); // All directories
    let files = dirItems.filter(item => !item.dir); // All files

    // Sort directories and files alphabetically by name
    files.sort((a, b) => {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
    });

	const defGetter = function() { return exploreDir({ dir: this.FullPath, fileFilters: fileFilters, fileoptions: fileoptions }); };
	const hddGetter = function() { const part = mountHDDPartition(this.Name); return exploreDir({ dir:`${part}:/`, fileFilters: fileFilters, fileoptions: fileoptions}); };
	const getter = (isHdd) ? hddGetter : defGetter;

	for (let i = 0; i < directories.length; i++) {
		let item = directories[i];

		collection.push({
            Name: item.name,
            Description: "",
            Icon: 18,
            Type: "SUBMENU",
            FullPath: `${params.dir}${item.name}/`,
            Device: getDeviceName(params.dir)
        });
        Object.defineProperty(collection[collection.length - 1], "Value", { get: getter });
        Object.defineProperty(collection[collection.length - 1], "FileCount", {
            get() {
                delete this.FileCount;
                let list = [];
                try { list = os.readdir(this.FullPath)[0] || []; } catch (e) { list = []; }
                const count = (!fileFilters)
                    ? list.length
                    : list.reduce((acc, name) => acc + (extensionMatches(name, fileFilters) ? 1 : 0), 0);
                this.FileCount = count;
                return count;
            },
            enumerable: true,
            configurable: true
        });
	}

    collection.sort((a, b) => {
        const nameA = a.Name.toLowerCase();
        const nameB = b.Name.toLowerCase();
        return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
    });

	for (let i = 0; i < files.length; i++) {
		let item = files[i];
		if (!fileFilters || extensionMatches(item.name, fileFilters)) {
			const itemParams = {
				path: `${params.dir}${item.name}`,
				size: item.size,
				fileoptions: fileoptions
			}

			collection.push(getFileAsItem(itemParams));
		}
	}

	return { Items: collection, Default: 0 };
}
function getFileAsItem(params) {
    const item = {
        Name: getFileName(params.path),
        Description: formatFileSize(params.size),
        Icon: "FILE",
        FullPath: params.path,
        Device: getDeviceName(params.path)
    }

    const ext2 = getFileExtension(params.path).toLowerCase();
    switch (ext2) {
        case "vcd":
        case "cue": item.Icon = "DISC_PS1"; break;
        case "iso": item.Icon = "DISC_PS2"; break;
        case "elf": item.Icon = "TOOL"; item.Type = "ELF"; item.Value = { Path: params.path, Args: [] }; break;
        case "psu": item.Icon = "TOOL"; break;
        case "bin": item.Icon = "BIN_ARCHIVE"; break;
        case "irx": item.Icon = "IRX_FILE"; break;
        case "cfg": item.Icon = "CFG_FILE"; break;
        case "sys": item.Icon = "SYS_FILE"; break;
        case "exe": item.Icon = "EXE_FILE"; break;
        case "icn": item.Icon = "ICN_FILE"; break;
        case "ico": item.Icon = "ICO_FILE"; break;
        case "png": item.Icon = "PNG_IMAGE"; break;
        case "jpg": item.Icon = "JPG_IMAGE"; break;
        case "bmp": item.Icon = "BMP_IMAGE"; break;
        case "gif": item.Icon = "GIF_FILE"; break;
        case "mp3": item.Icon = "MP3_FILE"; break;
        case "wav": item.Icon = "WAV_FILE"; break;
        case "ogg": item.Icon = "CAT_MUSIC"; break;
        case "mkv": item.Icon = "MKV_FILE"; break;
        case "mp4": item.Icon = "MP4_FILE"; break;
        case "avi": item.Icon = "AVI_FILE"; break;
        case "bik": item.Icon = "BIK_FILE"; break;
        case "mpg": item.Icon = "MPG_FILE"; break;
        case "mpeg": item.Icon = "CAT_VIDEO"; break;
        case "mov": item.Icon = "CAT_VIDEO"; break;
        case "wmv": item.Icon = "CAT_VIDEO"; break;
        case "flv": item.Icon = "CAT_VIDEO"; break;
        case "3gp": item.Icon = "CAT_VIDEO"; break;
        case "asf": item.Icon = "CAT_VIDEO"; break;
        case "divx": item.Icon = "CAT_VIDEO"; break;
        case "xvid": item.Icon = "CAT_VIDEO"; break;
        case "rblx": item.Icon = "RBLX_FILE"; break;
        case "rar": item.Icon = "RAR_FILE"; break;
    }

    if (('fileoptions' in params) && params.fileoptions) { item.Option = params.fileoptions; }

    return item;
}
function getDeviceName(path) {
    const root = getRootName(path);
    let name = root;
    if (root === "mass") {
        name = "usb";
    }
    else if (root.startsWith("mass")) {
        try {
            const info = System.getBDMInfo(`${root}:`);
            if (info && info.name) {
                name = info.name;
                switch (name) {
                    case "sdc": name = "mx4sio"; break;
                    case "sd": name = "ilink"; break;
                    case "udp": name = "udpbd"; break;
                }
            } else { name = "usb"; }
        } catch (e) { name = "usb"; }
    }
    else if (root.includes("pfs")) {
        name = "hdd";
    }

    return name.toUpperCase();
}
function deleteItem(collection, id) {
    const item = collection[id];
    const path = item.FullPath;
    if (path.endsWith("/")) {
        try {
            const directory = os.readdir(path)[0] || [];
            while (directory.length > 0) { try { os.remove(`${path}${directory.shift()}`); } catch (e) { break; } }
            try { System.removeDirectory(path); } catch (e) {}
        } catch (e) {}
    }
    else { os.remove(path); }
    collection.splice(id, 1);
}

//////////////////////////////////////////////////////////////////////////
///*				   			   Paths							  *///
//////////////////////////////////////////////////////////////////////////

/* Get the root of a path */
function getRootName(path) {
    const colonIndex = path.indexOf(":");
    if (colonIndex === -1) {
        throw new Error("Invalid path format. No ':' found.");
    }
    return path.slice(0, colonIndex);
}

/*	Get the full path without the root	*/
function getPathWithoutRoot(path) {
    const colonIndex = path.indexOf(":");
    if (colonIndex === -1) {
        throw new Error("Invalid path format. No ':' found.");
    }
    return path.slice(colonIndex + 2); // Skip ":/" to get the remaining path
}

/*	Parses a filepath to get its filename or folder name	*/
function getFileName(path) {
    // Strip drive letters like C:\ or prefixes like X:...
    const colonIndex = path.indexOf(":");
    if (colonIndex !== -1) path = path.slice(colonIndex + 1);

    // Remove trailing slash if more than one (normalize double slashes)
    while (path.length > 1 && path.endsWith("/")) {
        path = path.slice(0, -1);
    }

    const lastSlashIndex = path.lastIndexOf('/');
    return lastSlashIndex === -1 ? path : path.substring(lastSlashIndex + 1);
}

/*	Parses a filepath to get its extension if it has one	*/
function getFileExtension(filePath) {
    if (typeof filePath !== 'string') return "";

    // Extract extension after the last dot, if any
    const lastDotIndex = filePath.lastIndexOf('.');
    if (lastDotIndex === -1 || lastDotIndex === filePath.length - 1) {
        return ""; // No extension found or dot is at the end
    }

    return filePath.substring(lastDotIndex + 1);
}

/*	Parses a filepath to search if it matches any extension from a list of extensions	*/
function extensionMatches(filePath, filterExtensions) {
    if (!Array.isArray(filterExtensions) || filterExtensions.length === 0) {
        console.log("At least one filter extension must be provided.");
        return false;
    }

    const fileExtension = getFileExtension(filePath);

    // Compare the extracted extension with any of the filters (case-insensitive)
    return filterExtensions.some(filter =>
        typeof filter === 'string' &&
        fileExtension?.toLowerCase() === filter.toLowerCase()
    );
}

/*	Converts a given integer into a byte formatted string	*/
function formatFileSize(size) {
  if (size < 0) return "";

  const suffixes = ["b", "Kb", "Mb", "Gb", "Tb"];
  let index = 0;

  while (size >= 1024 && index < suffixes.length - 1) {
    size /= 1024;
    index++;
  }

  // Round to nearest whole number or one decimal place if needed
  const rounded = index > 2 ? Number(size.toFixed(1)) : ~~(size);

  return `${rounded} ${suffixes[index]}`;
}

function readAllBytes(path) {
    const fd = os.open(path, os.O_RDONLY);
    if (fd < 0) { return new Uint8Array(0); }
    const BLOCK_SIZE = 65536;
    const buf = new ArrayBuffer(BLOCK_SIZE);
    const view = new Uint8Array(buf);
    const parts = [];
    while (true) {
        const r = os.read(fd, buf, 0, BLOCK_SIZE);
        if (r <= 0) { break; }
        const chunk = new Uint8Array(r);
        for (let i = 0; i < r; i++) { chunk[i] = view[i]; }
        parts.push(chunk);
    }
    os.close(fd);
    let total = 0;
    for (let i = 0; i < parts.length; i++) { total += parts[i].length; }
    const out = new Uint8Array(total);
    let off = 0;
    for (let i = 0; i < parts.length; i++) { out.set(parts[i], off); off += parts[i].length; }
    return out;
}

function writeBMP32(path, width, height, rgba) {
    const fileHeader = new ArrayBuffer(14);
    const infoHeader = new ArrayBuffer(40);
    const dv1 = new DataView(fileHeader);
    const dv2 = new DataView(infoHeader);
    dv1.setUint8(0, 0x42);
    dv1.setUint8(1, 0x4D);
    const pixelSize = width * height * 4;
    const fileSize = 14 + 40 + pixelSize;
    dv1.setUint32(2, fileSize, true);
    dv1.setUint32(6, 0, true);
    dv1.setUint32(10, 14 + 40, true);
    dv2.setUint32(0, 40, true);
    dv2.setInt32(4, width, true);
    dv2.setInt32(8, height, true);
    dv2.setUint16(12, 1, true);
    dv2.setUint16(14, 32, true);
    dv2.setUint32(16, 0, true);
    dv2.setUint32(20, pixelSize, true);
    dv2.setInt32(24, 2835, true);
    dv2.setInt32(28, 2835, true);
    dv2.setUint32(32, 0, true);
    dv2.setUint32(36, 0, true);
    const fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC);
    if (fd < 0) { return false; }
    os.write(fd, fileHeader, 0, 14);
    os.write(fd, infoHeader, 0, 40);
    const row = width * 4;
    const tmp = new ArrayBuffer(row);
    const tv = new Uint8Array(tmp);
    for (let y = height - 1; y >= 0; y--) {
        const start = y * row;
        for (let x = 0; x < row; x += 4) {
            tv[x] = rgba[start + x + 2];
            tv[x + 1] = rgba[start + x + 1];
            tv[x + 2] = rgba[start + x];
            tv[x + 3] = rgba[start + x + 3];
        }
        os.write(fd, tmp, 0, row);
    }
    os.close(fd);
    return true;
}

function writeBMP24(path, width, height, rgba) {
    const fileHeader = new ArrayBuffer(14);
    const infoHeader = new ArrayBuffer(40);
    const dv1 = new DataView(fileHeader);
    const dv2 = new DataView(infoHeader);
    dv1.setUint8(0, 0x42);
    dv1.setUint8(1, 0x4D);
    const rowRaw = width * 3;
    const rowPad = (4 - (rowRaw % 4)) % 4;
    const imageSize = (rowRaw + rowPad) * height;
    const fileSize = 14 + 40 + imageSize;
    dv1.setUint32(2, fileSize, true);
    dv1.setUint32(6, 0, true);
    dv1.setUint32(10, 14 + 40, true);
    dv2.setUint32(0, 40, true);
    dv2.setInt32(4, width, true);
    dv2.setInt32(8, height, true);
    dv2.setUint16(12, 1, true);
    dv2.setUint16(14, 24, true);
    dv2.setUint32(16, 0, true);
    dv2.setUint32(20, imageSize, true);
    dv2.setInt32(24, 2835, true);
    dv2.setInt32(28, 2835, true);
    dv2.setUint32(32, 0, true);
    dv2.setUint32(36, 0, true);
    const fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC);
    if (fd < 0) { return false; }
    os.write(fd, fileHeader, 0, 14);
    os.write(fd, infoHeader, 0, 40);
    const srcStride = width * 4;
    const rowBuf = new ArrayBuffer(rowRaw + rowPad);
    const rv = new Uint8Array(rowBuf);
    for (let y = height - 1; y >= 0; y--) {
        const s = y * srcStride;
        let d = 0;
        for (let x = 0; x < width; x++) {
            const p = s + x * 4;
            rv[d++] = rgba[p + 2];
            rv[d++] = rgba[p + 1];
            rv[d++] = rgba[p + 0];
        }
        for (let k = 0; k < rowPad; k++) rv[d++] = 0;
        os.write(fd, rowBuf, 0, d);
    }
    os.close(fd);
    return true;
}

function parseGIF(bytes) {
    let p = 0;
    function u8() { return bytes[p++]; }
    function u16() { const v = bytes[p] | (bytes[p + 1] << 8); p += 2; return v; }
    function subblocks() { const out = []; while (true) { const len = u8(); if (len === 0) break; for (let i = 0; i < len; i++) out.push(u8()); } return new Uint8Array(out); }
    const header = String.fromCharCode(u8(), u8(), u8(), u8(), u8(), u8());
    const w = u16();
    const h = u16();
    const packed = u8();
    const bg = u8();
    u8();
    let gct = null;
    if (packed & 0x80) {
        const sz = 1 << ((packed & 0x07) + 1);
        gct = new Uint8Array(sz * 3);
        for (let i = 0; i < gct.length; i++) gct[i] = u8();
    }
    const frames = [];
    let gce = { delay: 10, transp: -1, dispose: 0 };
    while (p < bytes.length) {
        const b = u8();
        if (b === 0x3B) break;
        if (b === 0x21) {
            const label = u8();
            if (label === 0xF9) {
                const n = u8();
                const packedG = u8();
                const delay = u16();
                const transp = u8();
                u8();
                gce = { delay: delay, transp: ((packedG & 0x01) ? transp : -1), dispose: (packedG >> 2) & 0x07 };
            } else { subblocks(); }
            continue;
        }
        if (b === 0x2C) {
            const ix = u16();
            const iy = u16();
            const iw = u16();
            const ih = u16();
            const ip = u8();
            let lct = null;
            const interlaced = (ip & 0x40) !== 0;
            if (ip & 0x80) {
                const sz = 1 << ((ip & 0x07) + 1);
                lct = new Uint8Array(sz * 3);
                for (let i = 0; i < lct.length; i++) lct[i] = u8();
            }
            const minCode = u8();
            const data = subblocks();
            frames.push({ ix, iy, iw, ih, interlaced, lct, minCode, data, gce });
            gce = { delay: 10, transp: -1, dispose: 0 };
            continue;
        }
        break;
    }
    return { w, h, gct, frames };
}

function lzwDecode(minCode, data) {
    let pos = 0;
    function readCode(size) {
        let code = 0, shift = 0;
        while (shift < size) {
            const byte = data[pos >> 3];
            const bit = pos & 7;
            const take = Math.min(8 - bit, size - shift);
            code |= ((byte >> bit) & ((1 << take) - 1)) << shift;
            pos += take;
            shift += take;
        }
        return code;
    }
    const out = [];
    const clear = 1 << minCode;
    const end = clear + 1;
    let size = minCode + 1;
    let dict = [];
    for (let i = 0; i < clear; i++) dict[i] = [i];
    function reset() { size = minCode + 1; dict = []; for (let i = 0; i < clear; i++) dict[i] = [i]; dict[clear] = []; dict[end] = []; }
    reset();
    let prev = null;
    while (true) {
        const code = readCode(size);
        if (code === clear) { reset(); prev = null; continue; }
        if (code === end) break;
        let entry;
        if (dict[code]) entry = dict[code].slice(0);
        else if (code === dict.length) entry = prev.concat(prev[0]);
        else break;
        out.push.apply(out, entry);
        if (prev) {
            dict.push(prev.concat(entry[0]));
            if (dict.length === (1 << size) && size < 12) size++;
        }
        prev = entry;
        if (pos >= data.length * 8) break;
    }
    return new Uint16Array(out);
}

function composeGIF(g, limitFrames) {
    const w = g.w, h = g.h;
    const canvas = new Uint8Array(w * h * 4);
    let prevRect = null;
    let prevCanvas = null;
    const seq = [];
    for (let f = 0; f < g.frames.length; f++) {
        if (limitFrames && f >= limitFrames) break;
        const fr = g.frames[f];
        const pal = fr.lct ? fr.lct : g.gct;
        const decoded = lzwDecode(fr.minCode, fr.data);
        const idxs = new Uint16Array(fr.iw * fr.ih);
        if (!fr.interlaced) {
            for (let i = 0; i < idxs.length; i++) idxs[i] = decoded[i];
        } else {
            let line = 0;
            const passes = [0, 4, 2, 1];
            const steps = [8, 8, 4, 2];
            let k = 0;
            for (let p = 0; p < 4; p++) {
                for (let y = passes[p]; y < fr.ih; y += steps[p]) {
                    for (let x = 0; x < fr.iw; x++) { idxs[y * fr.iw + x] = decoded[k++]; }
                }
            }
        }
        if (fr.gce.dispose === 3) { prevCanvas = new Uint8Array(canvas.length); prevCanvas.set(canvas); }
        for (let y = 0; y < fr.ih; y++) {
            for (let x = 0; x < fr.iw; x++) {
                const ix = idxs[y * fr.iw + x];
                if (fr.gce.transp !== -1 && ix === fr.gce.transp) continue;
                const r = pal[ix * 3];
                const g1 = pal[ix * 3 + 1];
                const b = pal[ix * 3 + 2];
                const cx = fr.ix + x;
                const cy = fr.iy + y;
                const pos = (cy * w + cx) * 4;
                canvas[pos] = r;
                canvas[pos + 1] = g1;
                canvas[pos + 2] = b;
                canvas[pos + 3] = 255;
            }
        }
        const delayMs = Math.max(fr.gce.delay * 10, 10);
        seq.push({ delayMs, rgba: new Uint8Array(canvas.slice(0)) });
        prevRect = { x: fr.ix, y: fr.iy, w: fr.iw, h: fr.ih };
        if (fr.gce.dispose === 2) {
            for (let y = 0; y < prevRect.h; y++) {
                for (let x = 0; x < prevRect.w; x++) {
                    const pos = ((prevRect.y + y) * w + (prevRect.x + x)) * 4;
                    canvas[pos] = 0; canvas[pos + 1] = 0; canvas[pos + 2] = 0; canvas[pos + 3] = 0;
                }
            }
        } else if (fr.gce.dispose === 3 && prevCanvas) {
            canvas.set(prevCanvas);
        }
    }
    return { w, h, frames: seq };
}

function StartGifViewer(path, prevState) {
    let prev = prevState;
    DashUI.AnimationQueue.push(() => { DashUI.Overlay.Alpha += 16; if (DashUI.Overlay.Alpha >= 128) { return true; } return false; });
    if (typeof SetDashPadEvents !== 'undefined') { SetDashPadEvents(9); }

    const bytes = readAllBytes(path);
    const g = parseGIF(bytes);
    const seq = composeGIF(g, 200);

    const root = getRootName(path);
    const tmpDir = `${root}:/__osdxmb_tmp/`;
    if (!std.exists(tmpDir)) { os.mkdir(tmpDir); }

    const frameFiles = [];
    for (let i = 0; i < seq.frames.length; i++) {
        const fr = seq.frames[i];
        const tmp = `${tmpDir}${getFileName(path)}_${i.toString()}.bmp`;
        writeBMP24(tmp, seq.w, seq.h, fr.rgba);
        frameFiles.push({ path: tmp, delayMs: Math.max(fr.delayMs, 50) });
    }

    let current = 0;
    let img = new Image(frameFiles[0].path);
    img.optimize();
    img.filter = LINEAR;

    const iw0 = img.width;
    const ih0 = img.height;
    const scaleW0 = ScrCanvas.width / iw0;
    const scaleH0 = ScrCanvas.height / ih0;
    const scale0 = (scaleW0 < scaleH0) ? scaleW0 : scaleH0;
    const drawW = Math.floor(iw0 * scale0);
    const drawH = Math.floor(ih0 * scale0);
    const ox = Math.floor((ScrCanvas.width - drawW) / 2);
    const oy = Math.floor((ScrCanvas.height - drawH) / 2);

    function ensureImage(index) {
        if (img) { img.free(); }
        img = new Image(frameFiles[index].path);
        img.optimize();
        img.filter = LINEAR;
        img.width = drawW;
        img.height = drawH;
    }

    function drawFn() { img.color = Color.setA(img.color, DashUI.Overlay.Alpha); img.draw(ox, oy); }
    UICONST.LayersFg.push(drawFn);

    ensureImage(0);
    let elapsed = 0;
    const tick = os.setInterval(() => {
        pad.update();
        if (DashUI.ViewerExit || pad.justPressed(Pads.CIRCLE) || pad.justPressed(PadSettings.CancelButton)) {
            DashUI.ViewerExit = false;
            DashUI.AnimationQueue.push(() => {
                DashUI.Overlay.Alpha -= 16;
                if (DashUI.Overlay.Alpha <= 0) {
                    DashUI.State.Current = prev; DashUI.State.Next = prev; DashUI.State.Previous = prev;
                    if (img) { img.free(); }
                    UICONST.LayersFg.pop();
                    os.clearInterval(tick);
                    for (let i = 0; i < frameFiles.length; i++) { try { os.remove(frameFiles[i].path); } catch (e) {} }
                    return true;
                }
                return false;
            });
            return;
        }
        elapsed += 16;
        const delay = frameFiles[current].delayMs;
        if (elapsed >= delay) {
            elapsed = 0;
            current = (current + 1) % frameFiles.length;
            ensureImage(current);
        }
    }, 0);
}

function StartBmpViewer(path, prevState) {
    let prev = prevState;
    DashUI.AnimationQueue.push(() => { DashUI.Overlay.Alpha += 16; if (DashUI.Overlay.Alpha >= 128) { return true; } return false; });
    if (typeof SetDashPadEvents !== 'undefined') { SetDashPadEvents(9); }
    const bytes = readAllBytes(path);
    // Minimal BMP decoder: handle 24-bit and 32-bit BI_RGB
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const bfOffBits = dv.getUint32(10, true);
    const biSize = dv.getUint32(14, true);
    const w = dv.getInt32(18, true);
    const h = dv.getInt32(22, true);
    const planes = dv.getUint16(26, true);
    const bpp = dv.getUint16(28, true);
    const comp = dv.getUint32(30, true);
    if (planes !== 1 || (comp !== 0) || (w <= 0) || (h === 0)) { DashUI.State.Next = prev; return; }
    const topDown = h < 0; const height = Math.abs(h);
    const rgba = new Uint8Array(w * height * 4);
    if (bpp === 24) {
        const rowRaw = ((w * 3 + 3) & ~3);
        for (let y = 0; y < height; y++) {
            const srcY = topDown ? y : (height - 1 - y);
            let src = bfOffBits + srcY * rowRaw;
            let dst = y * w * 4;
            for (let x = 0; x < w; x++) {
                const b = dv.getUint8(src++);
                const g = dv.getUint8(src++);
                const r = dv.getUint8(src++);
                rgba[dst++] = r; rgba[dst++] = g; rgba[dst++] = b; rgba[dst++] = 255;
            }
        }
    } else if (bpp === 32) {
        const rowRaw = w * 4;
        for (let y = 0; y < height; y++) {
            const srcY = topDown ? y : (height - 1 - y);
            let src = bfOffBits + srcY * rowRaw;
            let dst = y * w * 4;
            for (let x = 0; x < w; x++) {
                const b = dv.getUint8(src++);
                const g = dv.getUint8(src++);
                const r = dv.getUint8(src++);
                const a = dv.getUint8(src++);
                rgba[dst++] = r; rgba[dst++] = g; rgba[dst++] = b; rgba[dst++] = a;
            }
        }
    } else {
        DashUI.State.Next = prev; return;
    }

    const root = getRootName(path);
    const tmpDir = `${root}:/__osdxmb_tmp/`;
    if (!std.exists(tmpDir)) { os.mkdir(tmpDir); }
    const out = `${tmpDir}${getFileName(path)}_normalized.bmp`;
    writeBMP24(out, w, height, rgba);

    let img = new Image(out);
    img.optimize();
    img.filter = LINEAR;
    const iw = img.width, ih = img.height;
    const scaleW = ScrCanvas.width / iw;
    const scaleH = ScrCanvas.height / ih;
    const scale = (scaleW < scaleH) ? scaleW : scaleH;
    
    // Variables de zoom y navegación
    let zoom = 1.0;
    let zoomObjetivo = 1.0;
    let offsetX = 0;
    let offsetY = 0;
    let offsetXObjetivo = 0;
    let offsetYObjetivo = 0;
    let mostrarControles = true;
    let tiempoControles = 0;
    const ZOOM_MIN = 0.5;
    const ZOOM_MAX = 5.0;
    const ZOOM_VELOCIDAD = 0.05; // Más suave
    const NAVEGACION_VELOCIDAD_PAD = 4.0; // Velocidad con pad direccional
    const NAVEGACION_VELOCIDAD_ANALOGICO = 3.5; // Velocidad con analógico
    const UMBRAL_ANALOGICO = 25;
    const SUAVIDAD_ZOOM = 0.12; // Interpolación más suave para zoom
    const SUAVIDAD_NAVEGACION = 0.25; // Interpolación más suave para navegación
    
    // Calcular dimensiones base
    const baseWidth = Math.floor(iw * scale);
    const baseHeight = Math.floor(ih * scale);
    const baseOffsetX = Math.floor((ScrCanvas.width - baseWidth) / 2);
    const baseOffsetY = Math.floor((ScrCanvas.height - baseHeight) / 2);
    
    // Función para limitar el offset
    function limitarOffset() {
        // Usar zoom actual (no zoomObjetivo) para cálculos más precisos
        const anchoActual = baseWidth * zoom;
        const altoActual = baseHeight * zoom;
        
        // Solo limitar si la imagen es más grande que la pantalla
        if (anchoActual > ScrCanvas.width) {
            const maxOffsetX = (anchoActual - ScrCanvas.width) / 2;
            if (offsetXObjetivo > maxOffsetX) offsetXObjetivo = maxOffsetX;
            if (offsetXObjetivo < -maxOffsetX) offsetXObjetivo = -maxOffsetX;
        } else {
            // Si la imagen es más pequeña, centrarla
            offsetXObjetivo = 0;
        }
        
        if (altoActual > ScrCanvas.height) {
            const maxOffsetY = (altoActual - ScrCanvas.height) / 2;
            if (offsetYObjetivo > maxOffsetY) offsetYObjetivo = maxOffsetY;
            if (offsetYObjetivo < -maxOffsetY) offsetYObjetivo = -maxOffsetY;
        } else {
            // Si la imagen es más pequeña, centrarla
            offsetYObjetivo = 0;
        }
    }
    
    // Función para dibujar controles elegantes
    function dibujarControles() {
        if (!mostrarControles) return;
        const fuente = FontObj.Font;
        const tiempoMax = 240;
        const alpha = Math.floor(220 * (1.0 - Math.min(1.0, tiempoControles / tiempoMax)));
        if (alpha < 15) return;
        const color = Color.new(255, 255, 255, alpha);
        const colorAcento = Color.new(200, 255, 200, alpha);
        const colorFondo = Color.new(0, 0, 0, Math.floor(alpha * 0.75));
        const colorFondoBorde = Color.new(100, 150, 100, Math.floor(alpha * 0.3));
        fuente.scale = FontObj.SizeS;
        const SAFE_MARGIN = 24;
        const iconSize = 16;
        const rowH = 20;
        const rows = 6;
        const panelW = 320;
        const panelH = rows * rowH + 10;
        const panelX = SAFE_MARGIN;
        const panelY = ScrCanvas.height - SAFE_MARGIN - panelH;
        Draw.rect(panelX - 2, panelY - 2, panelW + 4, panelH + 4, colorFondoBorde);
        Draw.rect(panelX, panelY, panelW, panelH, colorFondo);
        const iconX = panelX + 8;
        const textX = iconX + iconSize + 8;
        let y = panelY + 5;
        fuente.color = colorAcento;
        PadIcons.drawScaled('R1', iconX, y, iconSize, iconSize, alpha);
        fuente.print(textX, y, "Acercar");
        y += rowH;
        PadIcons.drawScaled('R2', iconX, y, iconSize, iconSize, alpha);
        fuente.print(textX, y, "Alejar");
        y += rowH;
        fuente.color = color;
        PadIcons.drawScaled('UP', iconX, y, iconSize, iconSize, alpha);
        fuente.print(textX, y, "Mover");
        y += rowH;
        PadIcons.drawScaled('L3', iconX, y, iconSize, iconSize, alpha);
        fuente.print(textX, y, "Mover");
        y += rowH;
        PadIcons.drawScaled('START', iconX, y, iconSize, iconSize, alpha);
        fuente.print(textX, y, "Mostrar/Ocultar");
        y += rowH;
        PadIcons.drawScaled('CIRCLE', iconX, y, iconSize, iconSize, alpha);
        fuente.print(textX, y, "Salir");
        const zoomText = `Zoom: ${zoom.toFixed(2)}x`;
        const zoomWidth = fuente.getTextSize(zoomText).width;
        const zoomX = ScrCanvas.width - SAFE_MARGIN - zoomWidth - 6;
        const zoomY = SAFE_MARGIN;
        Draw.rect(zoomX - 5, zoomY - 2, zoomWidth + 10, 20, colorFondo);
        fuente.color = colorAcento;
        fuente.print(zoomX, zoomY, zoomText);
    }
    
    function drawFn() {
        // Actualizar zoom suave (interpolación mejorada)
        const diferenciaZoom = zoomObjetivo - zoom;
        if (Math.abs(diferenciaZoom) > 0.005) {
            zoom += diferenciaZoom * SUAVIDAD_ZOOM;
        } else {
            zoom = zoomObjetivo;
        }
        
        // Actualizar offset suave (interpolación mejorada)
        const diferenciaX = offsetXObjetivo - offsetX;
        const diferenciaY = offsetYObjetivo - offsetY;
        if (Math.abs(diferenciaX) > 0.3) {
            offsetX += diferenciaX * SUAVIDAD_NAVEGACION;
        } else {
            offsetX = offsetXObjetivo;
        }
        if (Math.abs(diferenciaY) > 0.3) {
            offsetY += diferenciaY * SUAVIDAD_NAVEGACION;
        } else {
            offsetY = offsetYObjetivo;
        }
        
        // Calcular dimensiones y posición con zoom
        const anchoActual = baseWidth * zoom;
        const altoActual = baseHeight * zoom;
        const posX = baseOffsetX + offsetX - (anchoActual - baseWidth) / 2;
        const posY = baseOffsetY + offsetY - (altoActual - baseHeight) / 2;
        
        // Dibujar imagen
        img.width = Math.floor(anchoActual);
        img.height = Math.floor(altoActual);
        img.color = Color.setA(img.color, DashUI.Overlay.Alpha);
        img.draw(Math.floor(posX), Math.floor(posY));
        
        // Dibujar controles
        dibujarControles();
        tiempoControles++;
    }
    
    UICONST.LayersFg.push(drawFn);
    let tick = os.setInterval(() => {
        pad.update();
        if (DashUI.ViewerExit || pad.justPressed(Pads.CIRCLE) || pad.justPressed(PadSettings.CancelButton)) {
            DashUI.ViewerExit = false;
            // Detener el intervalo inmediatamente
            os.clearInterval(tick);
            
            // Iniciar animación de fade out
            DashUI.AnimationQueue.push(() => {
                DashUI.Overlay.Alpha -= 16;
                if (DashUI.Overlay.Alpha <= 0) {
                    // Remover función de dibujado del layer PRIMERO
                    if (UICONST.LayersFg.length > 0) {
                        UICONST.LayersFg.pop();
                    }
                    
                    // Liberar recursos de la imagen
                    if (img) {
                        img.free();
                        img = null;
                    }
                    
                    // Restaurar el estado anterior (esto regresa al menú principal)
                    // Esto es CRÍTICO: restaurar el estado antes de que termine la animación
                    DashUI.State.Current = prev;
                    DashUI.State.Next = prev;
                    DashUI.State.Previous = prev;
                    
                    // Limpiar archivo temporal
                    try {
                        os.remove(out);
                    } catch (e) {
                        // Ignorar errores
                    }
                    
                    // Resetear overlay completamente
                    DashUI.Overlay.Alpha = 0;
                    
                    // Forzar actualización del modo de pads para que funcione el menú
                    if (typeof SetDashPadEvents !== 'undefined') {
                        SetDashPadEvents(prev);
                    }
                    
                    return true;
                }
                return false;
            });
            
            // Salir del intervalo inmediatamente
            return;
        }
        
        if (pad.justPressed(Pads.START)) {
            mostrarControles = !mostrarControles;
            tiempoControles = 0;
        }
        
        // Zoom con R1 (acercar) - más suave
        if (pad.pressed(Pads.R1)) {
            zoomObjetivo += ZOOM_VELOCIDAD;
            if (zoomObjetivo > ZOOM_MAX) zoomObjetivo = ZOOM_MAX;
            limitarOffset();
            tiempoControles = 0;
        }
        
        // Zoom con R2 (alejar) - más suave
        if (pad.pressed(Pads.R2)) {
            zoomObjetivo -= ZOOM_VELOCIDAD;
            if (zoomObjetivo < ZOOM_MIN) zoomObjetivo = ZOOM_MIN;
            limitarOffset();
            tiempoControles = 0;
        }
        
        // Navegación con pad direccional (LEFT, RIGHT, UP, DOWN)
        let movimientoPad = false;
        
        if (pad.pressed(Pads.LEFT) || (pad.lx < -64)) {
            offsetXObjetivo -= NAVEGACION_VELOCIDAD_PAD;
            movimientoPad = true;
        }
        if (pad.pressed(Pads.RIGHT) || (pad.lx > 64)) {
            offsetXObjetivo += NAVEGACION_VELOCIDAD_PAD;
            movimientoPad = true;
        }
        if (pad.pressed(Pads.UP) || (pad.ly < -64)) {
            offsetYObjetivo -= NAVEGACION_VELOCIDAD_PAD; // Arriba es negativo
            movimientoPad = true;
        }
        if (pad.pressed(Pads.DOWN) || (pad.ly > 64)) {
            offsetYObjetivo += NAVEGACION_VELOCIDAD_PAD; // Abajo es positivo
            movimientoPad = true;
        }
        
        if (movimientoPad) {
            limitarOffset();
            tiempoControles = 0;
        }
        
        // Navegación con analógico izquierdo (más preciso)
        const lx = pad.lx;
        const ly = pad.ly;
        
        if (Math.abs(lx) > UMBRAL_ANALOGICO || Math.abs(ly) > UMBRAL_ANALOGICO) {
            const velocidadX = (lx / 128.0) * NAVEGACION_VELOCIDAD_ANALOGICO;
            const velocidadY = (ly / 128.0) * NAVEGACION_VELOCIDAD_ANALOGICO;
            
            offsetXObjetivo += velocidadX;
            offsetYObjetivo -= velocidadY;
            
            limitarOffset();
            tiempoControles = 0;
        }
    }, 0);
}

function resolveFilePath(filePath) {
    filePath = filePath.replace("{cwd}", CWD);
    filePath = filePath.replace("{bootpath}", System.boot_path);
    filePath = filePath.replace("//", "/");

    // Replace all {...} expressions with resolved values
    filePath = filePath.replace(/\{([^{}]+)\}/g, (_, expr) => eval(expr.trim()));
    if (!filePath.includes('?')) return filePath; // Literal path, return as is

    const prefixes = {
        'mass': Array.from({ length: 10 }, (_, i) => `mass${i}`),
        'mc': ['mc0', 'mc1'],
        'mmce': ['mmce0', 'mmce1']
    };

    const match = filePath.match(/^(mass|mc|mmce)\?:\/(.*)/);
    if (!match) return '';

    const [, root, subPath] = match;
    for (const variant of prefixes[root])
    {
        const fullPath = `${variant}:/${subPath}`;
        if (std.exists(fullPath))  { return fullPath; }
    }

    return ''; // File not found in any of the checked paths
}

/**
 * Write all text on 'txt' to 'path' file
 * @param {String} path The path to write the text file.
 * @param {String} txt The text to write to the file.
 * @param {String} mode The file mode (w, r, a, etc...).
 */
function ftxtWrite(path, txt, mode = "w+") {
    let file = false;
    try {
        let errObj = {};
        file = std.open(path, mode, errObj);
        if (!file) { throw new Error(`ftxtWrite(): IO ERROR - ${std.strerror(errObj.errno)}`); }
        file.puts(txt);
        file.flush();
    } catch (e) {
        xlog(e);
    } finally {
        if (file) { file.close(); }
    }
}

//////////////////////////////////////////////////////////////////////////
///*				   			    ISO								  *///
//////////////////////////////////////////////////////////////////////////

function getGameName(path) {

    const noExt = path.replace(/\.[^/.]+$/, "");
    const lastDot = noExt.lastIndexOf(".");
    if (lastDot === -1 || lastDot === noExt.length - 1) return noExt.trim();
    return noExt.slice(lastDot + 1);
}
function getGameCodeFromOldFormatName(path) {

    // Check for Pfs BatchKit Manager Pattern (PP.Game-ID..GameName.iso)
    let match = path.match(/[A-Z]{4}-\d{5}/);
    if (match) {
        const parts = match[0].split('-'); // ['SLPS', '12345']
        const gameCode = parts[0] + '_' + parts[1].slice(0, 3) + '.' + parts[1].slice(3);
        return gameCode;
    }

    // Check for old format pattern
    match = path.match(/[A-Z]{4}[-_]\d{3}\.\d{2}/);
    if (match) {
        return match[0].replace('-', '_');
    }

    return "";
}
function getISOgameID(isoPath, isoSize) {

    // Check if the Game ID is in the file name
	let ID = getGameCodeFromOldFormatName(isoPath);
    if (ID) return ID;

    const sectorSize = 2048; // Standard ISO sector size
    const PVD_OFFSET = 0x8000;
    const file = std.open(isoPath, "r");
    if (!file) { console.log(`Could not open file: ${isoPath}`); return ID; }

    // Seek to the Primary Volume Descriptor (sector 16 in ISO 9660)
    file.seek(PVD_OFFSET, std.SEEK_SET);
    const pvd = file.readAsString(sectorSize);

    // Check for "CD001" magic string in PVD
    if (!pvd || pvd.substring(1, 6) !== "CD001") {
        console.log(`${getGameName(isoPath)} Primary Volume Descriptor (CD001) not found.`);
        file.close();
        return ID;
    }

    // Extract the root directory offset and size
    file.seek(PVD_OFFSET + 158, std.SEEK_SET);
    const rootDirOffset = sectorSize * (file.getByte() | (file.getByte() << 8) | (file.getByte() << 16) | (file.getByte() << 24));

    file.seek(4, std.SEEK_CUR);
    const rootDirSize = (file.getByte() | (file.getByte() << 8) | (file.getByte() << 16) | (file.getByte() << 24));

    // Read the root directory
    if ((rootDirOffset > isoSize) || (rootDirSize > sectorSize)) {
        console.log(`${getGameName(isoPath)} ISO Read Error: Invalid Root Data.`);
        file.close();
        return ID;
    }

    file.seek(rootDirOffset, std.SEEK_SET);
    const rootDir = file.readAsString(rootDirSize);
    file.close();

    if ((!rootDir) || (rootDir.length === 0)) {
        console.log(`${getGameName(isoPath)} Root directory not found or is empty`);
        return ID;
    }

    // Match file name pattern
    const match = rootDir.match(/[A-Z]{4}[-_][0-9]{3}\.[0-9]{2}/);
    if (match) { ID = match[0]; }

    return ID;
}
function getPS2GameID(game, mutex = false) {
    const NeutrinoCFG = CfgMan.Get("neutrino.cfg");
    if (game.Name in NeutrinoCFG) { game.GameID = NeutrinoCFG[game.Name]; }
    else {
        if (mutex) MainMutex.unlock();
        const gamePath = `${game.Data.path}${game.Data.fname}`;
        const result = getISOgameID(gamePath, game.Data.size);
        if (mutex) MainMutex.lock();
        game.GameID = result;
        if (game.GameID) {
            NeutrinoCFG[game.Name] = game.GameID;
            CfgMan.Push("neutrino.cfg", NeutrinoCFG);
        }
    }

    game.Data.id = game.GameID;
    game.Description = " \u{B7} " + game.Data.dev.toUpperCase();
    game.Description = (game.GameID) ? game.GameID + game.Description : getLocalText(XMBLANG.UNKNOWN) + game.Description;
    game.Icon = (getGameArt(game)) ? "DISC_PS2" : -2;
}
function getISOgameArgs(info) {
    let args = [];
    args.push(`-cwd=${PATHS.Neutrino}`);
    args.push(`-bsd=${info.dev}`);

    switch (info.path.substring(0, 3)) {
        case "hdd":
            args.push(`-bsdfs=hdl`);
            args.push(`-dvd=hdl:${info.fname.slice(0, -4)}`); // Remove .iso extension
            break;
        default:
            let root = getRootName(info.path);
            let dir = getPathWithoutRoot(info.path);

            args.push(`-dvd=${root}:${dir}${info.fname}`);
            args.push(`-qb`);
            break;
    }

	// UPDATE: it's now a per game compatibility setting
    // Specify media type if available
    //if (info.mt !== "") { args.push(`-mt=${info.mt}`); }

	// Additional Main/Per-Game Settings.
	const ID = (info.id !== "") ? info.id : false;
    args = args.concat(GetNeutrinoArgs(ID));

    if (info.dev === "ata" && args.includes("-logo")) {
        // Remove -logo if using ata device
        args = args.filter(arg => arg !== "-logo");
    }

	return args;
}

//////////////////////////////////////////////////////////////////////////
///*				   			   POPS								  *///
//////////////////////////////////////////////////////////////////////////

function getVCDGameID(path, size) {

    let id = false;
    let file = false;

	try {
		if (size <= 0x10d900) { throw new Error(`File is too small: ${path}`); }

		file = std.open(path, "r");
		if (!file) { throw new Error(`Failed to open file: ${path}`); }

		// Seek to the desired position
        file.seek(0x10c900, std.SEEK_SET);

        // Read 4096 bytes
        const buffer = file.readAsString(4096);
        // Match the pattern
        const match = buffer.match(/[A-Z]{4}[-_][0-9]{3}\.[0-9]{2}/);

        if (match) { id = match[0]; }

	} catch (e) {
		xlog(e);
	} finally {
		if (file) { file.close(); }
	}

    return id;
}
function getPS1GameID(game, mutex = false) {
    const PopsCFG = CfgMan.Get("pops.cfg");
    if (game.Name in PopsCFG) { game.GameID = PopsCFG[game.Name]; }
    else {
        if (mutex) MainMutex.unlock();
        let path = game.Data.path;
        if (game.Data.dev === "hdd") { path = mountHDDPartition("__.POPS") + ":/"; }
        path = `${path}${game.Data.fname}`;
        const result = getVCDGameID(path, game.Data.size);
        if (mutex) MainMutex.lock();
        game.GameID = result;
        if (game.GameID) {
            PopsCFG[game.Name] = game.GameID;
            CfgMan.Push("pops.cfg", PopsCFG);
        }
    }

    game.Description = " \u{B7} " + game.Data.fdev;
    game.Description = (game.GameID) ? game.GameID + game.Description : getLocalText(XMBLANG.UNKNOWN) + game.Description;
    game.Icon = (getGameArt(game, "PS1")) ? "DISC_PS1" : -2;
}

/*	Info:

    Function to get if cheats on the 'cheats' array are enabled in the CHEATS.TXT file.
    Will return a Bool Array corresponding to each cheat on the 'cheats' array.
    'game' variable can be specified to get a game's CHEATS.TXT and must be the game's title.
	'device' variable can be specified to get a specific device CHEATS.TXT.

*/
function getPOPSCheat(params) {
	const cheats = params.cheats;
	const game = ('game' in params) ? `${params.game}/` : "";
	const device = ('device' in params) ? params.device : "mass";

    // Create an array to store whether each cheat is enabled
    const enabledCheats = new Array(cheats.length).fill(false);
    let path = "";

    switch (device) {
        case "hdd":
            if (os.readdir("hdd0:")[0].length === 0) { return enabledCheats; }
            const part = mountHDDPartition("__common");
            if (!os.readdir(`${part}:/`)[0].includes("POPS")) { return enabledCheats; }
            path = `${part}:/POPS/${game}`;
            break;
        case "mass": path = `mass:/POPS/${game}`; break;
        case "host": path = `${CWD}/POPS/${game}`; break;
    }

	const dirFiles = os.readdir(path)[0];
	if (!dirFiles.includes("CHEATS.TXT")) { return enabledCheats; }

	let errObj = {};
	let file = false;

	try {
		file = std.open(`${path}CHEATS.TXT`, "r", errObj);
		if (!file) { throw new Error(`getPOPSCheat(): I/O Error - ${std.strerror(errObj.errno)}`); }

		const content = file.readAsString();
		const lines = content.split(/\r?\n/);    // Split the content into lines

		// Iterate over the lines in the content
		for (const line of lines) {
			for (let i = 0; i < cheats.length; i++) {
				const cheatString = cheats[i];

				// Check if the line matches the enabled cheat format
				if (line === `$${cheatString}`) { enabledCheats[i] = true; }
			}
		}
	} catch (e) {
		xlog(e);
	} finally {
		if (file) { file.close(); }
	}

    return enabledCheats;
}

/*	Info:

    Function to set cheats on the 'cheats' array to a CHEATS.TXT file.
    'game' variable can be specified to set a game's CHEATS.TXT.
    'game' must be the game's title followed by a '/'.

*/
function setPOPSCheat(params) {
	let cheats = params.cheats;
	let game = ('game' in params) ? `${params.game}/` : "";
	let device = ('device' in params) ? params.device : "mass";
    let path = "";

    switch (device) {
        case "hdd":
            if (os.readdir("hdd0:")[0].length === 0) { return; }
            const part = mountHDDPartition("__common");
            if (!os.readdir(`${part}:/`)[0].includes("POPS")) { return; }
            path = `${part}:/POPS/${game}`;
            break;
        case "mass": path = `mass:/POPS/${game}`; break;
        case "host": path = `${CWD}/POPS/${game}`; break;
    }

    const dirFiles = os.readdir(path)[0];

    if (dirFiles.includes("CHEATS.TXT")) {
        let errObj = {};
        const file = std.open(`${path}CHEATS.TXT`, "r", errObj);
        if (!file) { xlog(`setPOPSCheat(): I/O ERROR - ${std.strerror(errObj.errno)}`); return; }
        const content = file.readAsString();
        file.close();

        const lines = content.split(/\r?\n/);    // Split the content into lines
        const resultLines = []; // To store the processed lines

        // Iterate over the lines in the content
        for (const line of lines) {
            let found = false;

            // Check if the line matches any cheat code
            for (let i = 0; i < cheats.length; i++) {
                const cheat = cheats[i];

                if (line === cheat.code || line === `$${cheat.code}`) {
                    found = true;

                    // If cheat is enabled, add it with `$`
                    if (cheat.enabled) { resultLines.push(`$${cheat.code}`); }
                    // Remove the cheat from the array
                    cheats.splice(i, 1);
                    break;
                }
            }

            // If the line wasn't related to a cheat, keep it unchanged
            if (!found) { resultLines.push(line); }
        }

        // Add remaining enabled cheats to the end
        for (const cheat of cheats) { if (cheat.enabled) { resultLines.push(`$${cheat.code}`); } }

        // Combine all lines into a single string
        ftxtWrite(`${path}CHEATS.TXT`, resultLines.join('\n'));
    }
    else {
        let lines = [];
        lines.push("$SAFEMODE");

        for (let i = 0; i < cheats.length; i++) {
            if (cheats[i].enabled) { lines.push(`$${cheats[i].code}`); }
        }

        if (lines.length > 0) { ftxtWrite(`${path}CHEATS.TXT`, lines.join('\n')); }
    }
}

function getPOPSElfPath(data) {
    const prefix = (data.dev === "mass") ? "XX." : "";
    let path = data.path;
    if (data.dev === "hdd") {
        const part = mountHDDPartition("__common");
        path = `${part}:/POPS/`;
    }

    const elfPath = `${path}${prefix}${data.fname.substring(0, data.fname.length - 3)}ELF`;

    if (!std.exists(elfPath)) { System.copyFile(`${path}POPSTARTER.ELF`, elfPath); }

    return elfPath;
}

//////////////////////////////////////////////////////////////////////////
///*				   			    ART								  *///
//////////////////////////////////////////////////////////////////////////

/*  Get Available Art Paths  */
function getArtPaths() {
    const IDs = System.listDir(PATHS.Art);
    if (IDs.length === 0) { return []; }
    return IDs.map(id => (id.dir && id.name !== "." && id.name !== "..") ? id.name : "").filter(name => name !== "");
}

function findArt(baseFilename, namePattern) {
    if (!baseFilename || !gArt.includes(baseFilename)) { return ""; }
    const artPath = `${PATHS.Art}/${baseFilename}/`;
    const files = os.readdir(artPath)[0];

    // Search for the file in the ART Folder case-insensitively
    for (let i = 0; i < files.length; i++) {
        let item = files[i];
        if (item.length === namePattern.length && item.toLowerCase() === namePattern) {
            return `${artPath}${item}`;
        }
    }

    // No Art was found.
    return "";
}

/*	Searchs for a matching ICO file in the ART folder for a specified string	*/
/*	Returns empty string if not found.											*/
function findICO(baseFilename) { return findArt(baseFilename, "icon0.png"); }

/*	Searchs for a matching BG file in the ART folder for a specified string	*/
/*	Returns empty string if not found.											*/
function findBG(baseFilename) { return findArt(baseFilename, "pic1.png"); }

function findPIC2(baseFilename) {
    let a = findArt(baseFilename, `pic2_0${UserConfig.Language + 1}.png`);
    if (a === "") { return findArt(baseFilename, "pic2.png"); }
    return a;
}

function tryDownloadGameArt(gameID, dir) {
    const requests = [];
    const baseUrl = `https://raw.githubusercontent.com/HiroTex/OSD-XMB-ARTDB/refs/heads/main/${dir}/`;
    const gameDir = `${PATHS.Art}${gameID}`;
    const paths = [
        "ICON0.PNG",
        "PIC1.PNG",
        "PIC2.PNG",
        "PIC2_01.PNG",
        "PIC2_02.PNG",
        "PIC2_03.PNG",
        "PIC2_04.PNG",
        "PIC2_05.PNG",
        "PIC2_06.PNG",
        "PIC2_07.PNG"
    ];

    if (std.exists(gameDir)) { return true; }
    os.mkdir(gameDir);
    for (let i = 0; i < paths.length; i++) {
        let path = paths[i];
        if (std.exists(`${gameDir}/${path}`)) { continue; }
        requests.push(() => {
            let req = new Request();
            MainMutex.unlock();
            req.download(`${baseUrl}${gameID}/${path}`, `${gameDir}/${path}`);
            MainMutex.lock();
            req = null;
        });
    }

    if (requests.length === 0) { return false; }
    requests.forEach((task) => { Tasks.Push(task); });
    Tasks.Push(() => {
        const dirList = System.listDir(gameDir);
        for (let i = 0; i < dirList.length; i++) {
            const item = dirList[i];
            if (item.size < 1024) { os.remove(`${gameDir}/${item.name}`); }
        }

        if (os.readdir(gameDir)[0].length === 0) { System.removeDirectory(gameDir); }
        else { gArt.push(gameID); }
    });

    return true;
}

function getGameArt(game, dir = "PS2") {

    if (!game.GameID || game.GameID === getLocalText(XMBLANG.UNKNOWN)) { return true; }

    const id = game.GameID;

    if (!gArt.includes(id)) {
        if ((UserConfig.Network !== 1) || !gNetArt.includes(id)) { return true; }
        if (tryDownloadGameArt(id, dir)) {
            Tasks.Push(() => getGameArt(game, dir));
            return false;
        }
        return true;
    }

    const ico0   = findICO(id);
    const pic1   = findBG(id);
    const pic2   = findPIC2(id);

    if (ico0)   { game.CustomIcon = ico0; }
    if (pic1)   { game.CustomBG   = pic1; }
    if (pic2)   { game.PIC2       = pic2; }

    return true;
}

//////////////////////////////////////////////////////////////////////////
///*				   		   Plugin System						  *///
//////////////////////////////////////////////////////////////////////////

function validatePlugin(plg) {
  return (
    (("Name" in plg) && (typeof plg.Name === "string") || (Array.isArray(plg.Name))) &&
    (("Icon" in plg) && ((typeof plg.Icon === "number") || (typeof plg.Icon === "string"))) &&
    (("Category" in plg) && (typeof plg.Category === "number")) &&
    (("Type" in plg) && (["ELF", "CODE", "SUBMENU", "DIALOG"].includes(plg.Type)))
  );
}
function AddNewPlugin(Plugin) {
    if (!validatePlugin(Plugin)) { return false; }
    const item = DashCatItems[Plugin.Category].Items.length;
    DashCatItems[Plugin.Category].Items[item] = Plugin;
}
function FindDashIcon(targetName) {
    if (typeof DashIconNameToIndex === 'object') {
        const idx = DashIconNameToIndex[targetName];
        if (idx !== undefined) { return idx; }
    }
    for (let i = 0; i < DashIconsInfo.length; i++) {
        if (DashIconsInfo[i].name === targetName) { return i; }
    }
    return -1;
}
function ExecuteItem(Item) {
	if (!Item) { return; }
	if (DashUI.SubMenu.Level < 0) {
		const safe = ((UserConfig.ParentalSet === 0) || (('Safe' in Item) && (Item.Safe === "true")));
		if (!safe) { OpenDialogParentalCheck(Item); return; }
	}
	DashUIObjectHandler(Item);
}
function ExecuteSpecial() {
	switch(gExit.Type) {
        case 0: System.exitToBrowser(); break;
        case 1: gExit.To = "main.js"; break;
	}
}
function ExecuteELF() {
    if ('Code' in gExit.Elf) { gExit.Elf.Code(); }
    if (gExit.Elf.Path.substring(0, 3) !== "pfs") { umountHDD(); }
    iopResNet(gExit.Elf.Path);
	console.log( `Executing Elf: ${gExit.Elf.Path}\n With Args: [ ${gExit.Elf.Args} ]`);
	System.loadELF(gExit.Elf.Path, gExit.Elf.Args, gExit.Elf.RebootIOP);
}
function ResetIOP(path) {
    let dev = getDeviceName(path);
    IOP.reset();
    switch (dev) {
        case "CDFS":
        case "CDFS0": IOP.loadModule("cdfs"); break;
        case "ATA": IOP.loadModule("ata_bd"); break;
        case "MX4SIO": IOP.loadModule("mx4sio_bd"); break;
        case "USB": IOP.loadModule("usbmass_bd"); break;
        case "UDPBD": IOP.loadModule("smap_udpbd"); break;
        case "HDD": IOP.loadModule("ps2fs"); break;
        case "MC":
        case "MC0":
        case "MC1": IOP.loadModule("mcman"); break;
        case "MMCE":
        case "MMCE0":
        case "MMCE1": IOP.loadModule("mmceman"); break;
    }

    os.sleep(1000);
}
function iopResNet(path) {
    if (NetInfo.IP === "-") { return; }
    NetDeinit();
    ResetIOP(path);
}

//////////////////////////////////////////////////////////////////////////
///*				   			 ICON.SYS							  *///
//////////////////////////////////////////////////////////////////////////

const IconSysMap81 = {
    0x40: ' ', 0x46: ':', 0x5E: '/',
    0x69: '(', 0x6A: ')',
    0x6D: '[', 0x6E: ']',
    0x6F: '{', 0x70: '}',
    0x7C: '-'
};

function parseIconSysTitle(path, name) {
    let ret = name;
    const syspath = `${path}${name}`;
    const files = os.readdir(syspath)[0];
    let fileExist = files.includes("icon.sys");
    if (!fileExist) { return ret; }

    let file = false;
    try {
        file = os.open(`${syspath}/icon.sys`, os.O_RDONLY);
        if (file < 0) { throw new Error(`Could not open ${syspath}/icon.sys.`); }

        const magic = new Uint8Array(4);
        let match = true;
        os.seek(file, 0, std.SEEK_SET);
        os.read(file, magic.buffer, 0, 4);

        // check magic
        if (
            magic[0] !== 0x50 || // 'P'
            magic[1] !== 0x53 || // 'S'
            magic[2] !== 0x32 || // '2'
            magic[3] !== 0x44    // 'D'
        ) {
            throw new Error(`${syspath}/icon.sys is not a valid icon.sys file.`);
        }


        if (!match) { throw new Error(`${syspath}/icon.sys is not a valid icon.sys file.`); }

        const linebreak = new Uint8Array(2);
        os.seek(file, 6, std.SEEK_SET);
        os.read(file, linebreak.buffer, 0, 2);
        const linepos = linebreak[0] >> 1;
        const title = new Uint8Array(68);
        os.seek(file, 192, std.SEEK_SET);
        os.read(file, title.buffer, 0, 68);

        let decoded = IconSysDecodeTitle(title);// check if title is only question marks
        if (decoded.replace(/\?/g, '').length === 0) {
            ret = name;
        } else {
            ret = decoded.slice(0, linepos) + " " + decoded.slice(linepos);
        }

    } catch (e) {
        xlog(e);
    } finally {
        if (file) { os.close(file); }
    }

    return ret;
}

// This will retrieve a UTF-8 string from the icon.sys S-JIS encoded Title
function IconSysDecodeTitle(strIn) {
    const out = [];

    for (let i = 0; i < 68; i += 2) {
        const t1 = strIn[i];
        const t2 = strIn[i + 1];

        if (t1 === 0x00) {
            if (t2 === 0x00) break;
            out.push('?');
            continue;
        }

        if (t1 === 0x81) {
            out.push(IconSysMap81[t2] || '?');
            continue;
        }

        if (t1 === 0x82) {
            if (t2 >= 0x4F && t2 <= 0x7A) {
                out.push(String.fromCharCode(t2 - 31));
            } else if (t2 >= 0x81 && t2 <= 0x9B) {
                out.push(String.fromCharCode(t2 - 32));
            } else if (t2 === 0x3F) {
                out.push(' ');
            } else {
                out.push('?');
            }
            continue;
        }

        out.push('?');
    }

    return out.join('');
}

//////////////////////////////////////////////////////////////////////////
///*				   			 HISTORY							  *///
//////////////////////////////////////////////////////////////////////////

// Functions to manage the history file on the memory card
function getSystemDataPath() {
    const tmp = std.open("rom0:ROMVER", "r");
    const ROMVER = tmp.readAsString();
    tmp.close();

    switch (ROMVER[4]) {
        case 'X':
        case 'H':
        case 'A': return "BADATA-SYSTEM";
        case 'C': return "BCDATA-SYSTEM";
        case 'E': return "BEDATA-SYSTEM";
        case 'T':
        case 'J': return "BIDATA-SYSTEM";
    }
}
function getCurrentDOSDate() {
    const year = gTime.year - 1980; // DOS date starts at 1980
    const month = gTime.month; // JS months are 0-based
    const day = gTime.day;
    return (year << 9) | (month << 5) | day;
}
function getMcHistoryFilePath() {
	const systemPath = getSystemDataPath();
	let path = `mc0:/${systemPath}/history`;
    if (!std.exists(path)) {
		// try memory card 2
		path = `mc1:/${systemPath}/history`;
		if (!std.exists(path)) { path = ""; }
    }
	return path;
}
function getMcHistory() {
    let data = [];
    const historyPath = getMcHistoryFilePath();
    if (historyPath === "") {
        console.log(`ERROR: Could not find history file`);
        return data;
    }

    const file = os.open(`mc0:/${getSystemDataPath()}/history`, os.O_RDONLY);
    if (file < 0) {
        console.log(`ERROR: Could not open history file`);
        return data;
    }

    const entrySize = 0x16;
    const buffer = new Uint8Array(entrySize);

    while (os.read(file, buffer.buffer, 0, entrySize) === entrySize) {
        const name = String.fromCharCode(...buffer.subarray(0, 0x10)).replace(/\x00+$/, '');
        const playCount = buffer[0x10];
        const bitmask = buffer[0x11];
        const bitshift = buffer[0x12];
        const dosDate = (buffer[0x14] | (buffer[0x15] << 8)); // Little-endian

        data.push({ name, playCount, bitmask, bitshift, dosDate });
    }

    os.close(file);

	return data;
}
function setMcHistory(entries) {
    const path = getSystemDataPath();
    let historyPath = getMcHistoryFilePath();
    let flags = os.O_RDWR;
    if (historyPath === "") { // file must be created
        // Make memory card path on slot 1
        os.mkdir(`mc0:/${path}`);
        historyPath = `mc0:/${path}/history`;
        flags = flags | os.O_CREAT;
    }
    const file = os.open(historyPath, flags);
    if (file < 0) {
        console.log(`ERROR: Could not open history file on ${historyPath}`);
        return false;
    }

    const entrySize = 0x16;
    const buffer = new Uint8Array(entrySize);
    for (const obj of entries) {
        buffer.fill(0);
        for (let i = 0; i < obj.name.length; i++) {
            buffer[i] = obj.name.charCodeAt(i);
        }
        buffer[0x10] = obj.playCount;
        buffer[0x11] = obj.bitmask;
        buffer[0x12] = obj.bitshift;
        buffer[0x13] = 0x00; // Padding zero
        buffer[0x14] = obj.dosDate & 0xFF;
        buffer[0x15] = (obj.dosDate >> 8) & 0xFF;

        os.write(file, buffer.buffer, 0, entrySize);
    }

    os.close(file);
    return true;
}
function setHistoryEntry(name) {
    const objects 	  = getMcHistory();
    const currentDate = getCurrentDOSDate();
    let found = false;
    let emptySlot = false;

    for (const obj of objects) {
        if (obj.name === name) {
            // If name exists, update play count and date
            obj.playCount = Math.min(obj.playCount + 1, 0x3F);
            obj.dosDate = currentDate;
            found = true;
            break;
        } else if (!emptySlot && obj.name === "") {
            // Store the first empty slot found
            emptySlot = obj;
        }
    }

    if (!found) {
        if (emptySlot) {
            // Reuse an empty slot
            emptySlot.name = name;
            emptySlot.playCount = 0x01;
            emptySlot.bitmask = 0x01;
            emptySlot.bitshift = 0x00;
            emptySlot.dosDate = currentDate;
        }
        else if (objects.length < 21) {
            // Append a new entry if the list is not full
            objects.push({
                name: name,
                playCount: 0x01,
                bitmask: 0x01,
                bitshift: 0x00,
                dosDate: currentDate
            });
        }
        else {
            xlog("ERROR: No space left to add a new entry.");
			return;
        }
    }

    return setMcHistory(objects);
}

//////////////////////////////////////////////////////////////////////////
///*				   			 Helpers							  *///
//////////////////////////////////////////////////////////////////////////

function cubicEaseOut(t) { return 1 - Math.pow(1 - t, 3); }
function cubicEaseIn(t) { return Math.pow(1 - t, 3); }
function createFade() {	return { In: false,	Progress: 0.0, Running: false }; }
function alphaCap(a) {	if (a < 0) { a = 0; } if (a > 128) { a = 128; }	return a; }
function getTimerSec(t) { return ~~(Timer.getTime(t) / 100000) }
function getLocalText(t) { return ((Array.isArray(t)) ? t[UserConfig.Language] : t); }
function getFadeProgress(fade) { return fade.Running ? (fade.In ? cubicEaseOut(fade.Progress) : cubicEaseIn(fade.Progress)) : 1; }
function interpolateColorObj(color1, color2, t) {
    return {
        R: Math.fround(color1.R + (color2.R - color1.R) * t),
        G: Math.fround(color1.G + (color2.G - color1.G) * t),
        B: Math.fround(color1.B + (color2.B - color1.B) * t),
    };
}

//////////////////////////////////////////////////////////////////////////
///*				   			   DEBUG							  *///
//////////////////////////////////////////////////////////////////////////

function DbgHandler() {
	if (!gDebug) { return; }

    const DebugInfo = [];
    const mem = System.getMemoryStats();
	DebugInfo.push(`${Screen.getFPS(360)}  FPS`);
	DebugInfo.push(`RAM USAGE: ${Math.floor(mem.used / 1024)}KB / ${Math.floor(ee_info.RAMSize / 1024)}KB`);
	DebugInfo.push(`WIDTH: ${ScrCanvas.width} HEIGHT: ${ScrCanvas.height}`);
    DebugInfo.push(`DATE: ${gTime.day}/${gTime.month}/${gTime.year} ${gTime.hour}:${gTime.minute}:${gTime.second}`);

    TxtPrint({ Text: DebugInfo, Position: { X: 5, Y: ScrCanvas.height - ((DebugInfo.length + 1) * 16)}});
    xlogProcess();
}
function xlog(l) {

    // Write line to log file with timestamp.
    const hours = String(gTime.hour).padStart(2, '0');
    const minutes = String(gTime.minute).padStart(2, '0');
    const seconds = String(gTime.second).padStart(2, '0');
    const milliseconds = String(gTime.millisecond).padStart(3, '0');
    const line = `[ ${hours}:${minutes}:${seconds}:${milliseconds} ] ${l}`;
    console.log(line);

    if (!gDebug) { return; }

    gDbgTxt.push(line);
}
function xlogProcess() {
    // Extract lines of gDbgTxt Var
    if (gDbgTxt.length < 1) { return; }
    const lines = gDbgTxt.splice(0, gDbgTxt.length).join('\n'); // Get all lines and clear the array
    ftxtWrite(`${PATHS.XMB}log.txt`, lines, "a"); // Write to file
}

//////////////////////////////////////////////////////////////////////////
///*				   			 Init Work							  *///
//////////////////////////////////////////////////////////////////////////

let gExit 		= {};
let gDebug      = false;
let gDbgTxt     = [];
let gArt     	= getArtPaths();
let gDevices    = getAvailableDevices();
let ScrCanvas 	= Screen.getMode();
const ee_info   = System.getCPUInfo();

const vmodes    = [ Screen.NTSC, Screen.PAL, Screen.DTV_480p ];
ScrCanvas.width = (UserConfig.Aspect === 0) ? 640 : 704;
if ('Vmode' in UserConfig) {
    ScrCanvas.height    = (UserConfig.Vmode === 1) ? 512 : 480;
    ScrCanvas.interlace = (UserConfig.Vmode === 2) ? Screen.PROGRESSIVE : Screen.INTERLACED;
    ScrCanvas.field     = (UserConfig.Vmode === 2) ? Screen.FRAME : Screen.FIELD;
    ScrCanvas.mode      = vmodes[UserConfig.Vmode];
}
Screen.setMode(ScrCanvas);
let TmpCanvas = Screen.getMode();

ftxtWrite(`${PATHS.XMB}log.txt`, ""); // Init Log File.
console.log("INIT LIB: SYSTEM COMPLETE");
