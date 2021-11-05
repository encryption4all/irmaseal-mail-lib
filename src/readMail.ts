import { IAttachment } from './attachment'

interface IReadIrmaSealMail {
    parseMail(s: string): void
    getVersion(): string
    getCiphertext(): Uint8Array
    getAttachments(): IAttachment[]
}

export class ReadMail implements IReadIrmaSealMail {
    private ct: Uint8Array
    private attachments: IAttachment[]
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

    getAttachments(): IAttachment[] {
        return this.attachments
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

        const [_, section2, section3, section4, ...attachments] = dataBuffer
            .split(`--${boundary}`)

        let ctPart: string
        let versionPart: string

        // check if mail contains 3 or 4 MIME parts (can depend on the client sending the mail)
        if (
            section4 === undefined ||
            section3.search('Content-Type: application/irmaseal; name="irmaseal.encrypted"') !== -1
        ) {
            versionPart = section2
            ctPart = section3
        } else {
            versionPart = section3
            ctPart = section4
        }

        const regExp = /Content-Type: application\/irmaseal; name=\"(.*)\"\r?\n\r?\n([\w]*)/gm

        versionPart = this.getMatches(versionPart, regExp, 2)[0]
        this.version = Buffer.from(versionPart, 'base64').toString('utf-8')

        ctPart = this.getMatches(ctPart, regExp, 2)[0]
        this.ct = new Uint8Array(
            Buffer.from(ctPart,
                'base64'
            )
        )

        attachments.forEach((section) => {
            if (section.length > 2) {
                let attachmentBody = new Uint8Array(
                    Buffer.from(
                        this.getMatches(section, regExp, 2)[0],
                        'base64'
                    )
                )

                const fileName = this.getMatches(section, regExp, 1)[0]

                const attachment: IAttachment = {
                    body: attachmentBody,
                    fileName: fileName.split(".enc")[0],
                }
                this.attachments.push(attachment)
            }
        })
    }
}
