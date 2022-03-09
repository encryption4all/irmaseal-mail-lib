interface IReadIrmaSealMail {
    parseMail(s: string): void
    getCiphertext(): Uint8Array
}

export class ReadMail implements IReadIrmaSealMail {
    private ct: Uint8Array

    /**
     * Gets the ciphertext of the mail
     * Ensure to b64 decode the CT like: Buffer.from(readMail.getCiphertext(), "base64").toString("utf-8")
     */
    getCiphertext(): Uint8Array {
        return this.ct
    }

    private getMatches(string, regex, index): string[] {
        index || (index = 1); // default to the first capturing group
        let matches = [];
        let match;
        while (match = regex.exec(string)) {
            matches.push(match[index]);
        }
        return matches;
    }


    /**
     * Parses the IRMASeal encrypted mail
     * @param dataBuffer, the mime mail as string buffer
     */
    parseMail(dataBuffer: string): void {
        const boundary: string = dataBuffer
            .match(/boundary=(.*)/gm)[0]
            .replace('boundary=', '')
            .replace(/"/g, '')
        const parts = dataBuffer.split(`--${boundary}`)
        const regExp = /Content-Type: application\/irmaseal; name=\"irmaseal\.encrypted\".*base64(.*)/gs
        const ctPart = this.getMatches(parts[2], regExp, 1)[0]
        this.ct = new Uint8Array(
            Buffer.from(ctPart,
                'base64'
            )
        )
    }
}
