import { IAttachment } from './attachment'

interface IComposeIrmaSealMail {
    addRecipient(recipient: string): void // need to update logic later to support multiple recipients
    setSender(sender: string): void
    setSubject(subject: string): void
    setCiphertext(ct: Uint8Array): void
    addAttachment(ct: Uint8Array, fileName: string, nonce: Uint8Array): void
    getMimeMail(): string
    getMimeHeader(): string
    getMimeBody(): string
}

export class ComposeMail implements IComposeIrmaSealMail {
    private recipient: string
    private sender: string
    private subject: string
    private ct: Uint8Array
    private version: string
    readonly boundary: string
    private attachments: IAttachment[]

    constructor() {
        this.boundary = this.generateBoundary()
        this.attachments = []
    }

    /**
     * Sets the version.
     * @param version, version of IRMASeal used
     */
    setVersion(version: string) {
        this.version = version
    }

    /**
     * Adds a recipient to the mail
     * Currently, only one recipient is supported.
     * @param {string} recipient, mail address of the recipient
     */
    addRecipient(recipient: string): void {
        this.recipient = recipient
    }

    /**
     * Sets the sender of the mail
     * @param {string} sender, mail address of the sender
     */
    setSender(sender: string) {
        this.sender = sender
    }

    addAttachment(ct: Uint8Array, fileName: string, nonce: Uint8Array) {
        const attachment: IAttachment = {
            body: ct,
            fileName: fileName,
            nonce: nonce,
        }
        this.attachments.push(attachment)
    }

    /**
     * Returns the MIME body
     */
    getMimeBody(): string {
        if (!this.ct) throw new Error('No ciphertext')

        const b64encoded = Buffer.from(this.ct).toString('base64')
        const version = Buffer.from(`Version ${this.version}`).toString(
            'base64'
        )
        const encryptedData = b64encoded.replace(/(.{80})/g, '$1\n')

        let content = `--${this.boundary}\r\n`
        content += 'Content-Type: text/html\r\n\r\n'
        content +=
            "<h1>IRMASeal mail</h1><p>This is an IRMAseal/MIME encrypted message.</p><p><a href='irma.app'>irma.app</a></p>\r\n\r\n"
        content += `--${this.boundary}\r\n`
        content += 'Content-Type: application/irmaseal\r\n'
        content += 'Content-Transfer-Encoding: base64\r\n\r\n'
        content += `${version}\r\n\r\n`
        content += `--${this.boundary}\r\n`
        content += 'Content-Type: application/octet-stream\r\n'
        content += 'Content-Transfer-Encoding: base64\r\n\r\n'
        content += `${encryptedData}\r\n`

        return content
    }

    /**
     * Returns the MIME header
     * @param includeVersion, whether or not to include the mime version (default = true)
     */
    getMimeHeader(includeVersion: boolean = true): string {
        const headers = {
            ...(this.subject && { Subject: `${this.subject}` }),
            ...(this.recipient && { To: `${this.recipient}` }),
            ...(this.sender && { From: `${this.sender}` }),
            ...(includeVersion && { 'MIME-Version': '1.0' }),
            'Content-Type': `multipart/mixed; protocol="application/irmaseal"; boundary=${this.boundary}`,
        }

        let headerStr = ''
        for (const [k, v] of Object.entries(headers)) {
            headerStr += `${k}: ${v}\r\n`
        }

        return headerStr
    }

    /**
     * Returns MIME attachments
     */
    getMimeAttachments(): string {
        let mimeAttachments = ''
        if (!this.attachments.length) return mimeAttachments

        this.attachments.forEach((attachment) => {
            // merge nonce and body of attachment (nonce header does not work as ignored by Exchange)
            const mergedArray = new Uint8Array(
                attachment.nonce.length + attachment.body.length
            )
            mergedArray.set(attachment.nonce)
            mergedArray.set(attachment.body, attachment.nonce.length)
            const b64encoded = Buffer.from(mergedArray)
                .toString('base64')
                .replace(/(.{80})/g, '$1\n')

            mimeAttachments += `--${this.boundary}\r\n`
            mimeAttachments += 'Content-Type: application/octet-stream\r\n'
            mimeAttachments += `Content-Disposition: attachment; filename="${attachment.fileName}.enc"\r\n`
            mimeAttachments += 'Content-Transfer-Encoding: base64\r\n\r\n'
            mimeAttachments += `${b64encoded}\r\n`

        })

        return mimeAttachments
    }

    /**
     * Returns the Mime header, body and attachments concatonated
     * @param, whether or not to include the MIME version in the headers (default = true)
     */
    getMimeMail(includeVersion: boolean = true): string {
        return `${this.getMimeHeader(
            includeVersion
        )}\r\n${this.getMimeBody()}\r\n${this.getMimeAttachments()}--${
            this.boundary
        }--`
    }

    /**
     * Sets the ciphertext of the mail
     * @param {string} ct, the ciphertext
     */
    setCiphertext(ct: Uint8Array): void {
        this.ct = ct
    }

    /**
     * Sets the subject of the mail
     * @param {string} subject, the subject
     */
    setSubject(subject: string): void {
        this.subject = subject
    }

    private generateBoundary(): string {
        let text = ''
        const possible =
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

        for (let i = 0; i < 30; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length))

        return text
    }
}
