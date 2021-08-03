interface IReadIrmaSealMail {
    parseMail(s: string): void
    getVersion(): string
    getCiphertext(): Uint8Array
    getAttachments(): Uint8Array[]
}

export class ReadMail implements IReadIrmaSealMail {
    private ct: Uint8Array
    private attachments: Uint8Array[]
    private version: string

    constructor() {
        this.attachments = []
    }

    /**
     * Gets the ciphertext of the mail
     * Ensure to b64 decode the CT like: Buffer.from(readMail.getCiphertext(), "base64").toString("utf-8")
     */
    getCiphertext(): Uint8Array {
        return this.ct
    }

    /**
     * Gets the version of the mail
     */
    getVersion(): string {
        return this.version
    }

    getAttachments(): Uint8Array[] {
        return this.attachments
    }

    /**
     * Parses the IRMASeal encrypted mail
     * @param dataBuffer, the mime mail as string buffer
     */
    parseMail(dataBuffer: string): void {
        const boundary: string = dataBuffer
            .match(/boundary=(.*)/gm)[0]
            .replace("boundary=", "")
            .replace(/"/g, "")

        const [_, section2, section3, section4] = dataBuffer
            .split(`--${boundary}`)
            .slice(0, -1)

        // needed for extracting possible attachments
        const sections = dataBuffer
            .split(`--${boundary}`)
            .slice(0, -1)

        let ctPart: string
        let versionPart: string

        // check if mail contains 3 or 4 MIME parts (can depend on the client sending the mail)
        if (
            section4 === undefined ||
            section3.search("Content-Type: application/octet-stream") !== -1
        ) {
            versionPart = section2
            ctPart = section3
        } else {
            versionPart = section3
            ctPart = section4
        }

        const regExp = /Content-Transfer-Encoding: base64\r?\n\r?\n([\s\S]*)/gm

        versionPart = versionPart
            .match(regExp)[0]
            .replace(regExp, "$1")
            .replace(" ", "")
            .replace("\r\n", "")
        this.version = Buffer.from(versionPart, "base64").toString("utf-8")

        this.ct = new Uint8Array(Buffer.from(ctPart
            .match(regExp)[0]
            .replace(regExp, "$1")
            .replace(/(?:\r\n|\r|\n| )/g, ""), "base64"))

        let attachmentsBegin = false
        sections.forEach((section) => {
            if (attachmentsBegin) {
                const attachment = new Uint8Array(Buffer.from(section
                    .match(regExp)[0]
                    .replace(regExp, "$1")
                    .replace(/(?:\r\n|\r|\n| )/g, ""), "base64"))
                this.attachments.push(attachment)
            }
            // attachments always come after body part
            else if (section == ctPart) {
                attachmentsBegin = true
            }
        })
    }
}
