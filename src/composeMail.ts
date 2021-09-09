import { Buffer } from 'buffer'

interface IComposeIrmaSealMail {
    addRecipient(recipient: string): void // need to update logic later to support multiple recipients
    setSender(sender: string): void
    setSubject(subject: string): void
    setCiphertext(ct: Uint8Array): void
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

    constructor() {
        this.boundary = this.generateBoundary()
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

    /**
     * Returns the MIME body
     */
    getMimeBody(): string {
        if (!this.ct) throw new Error('No ciphertext')
        const b64encoded = Buffer.from(this.ct).toString('base64')
        const version = Buffer.from(`Version ${this.version}`).toString('base64')
        const encryptedData = b64encoded.replace(/(.{80})/g, '$1\n')

        let content = 'Content-Type: text/plain\r\n\r\n'
        content += 'This is an IRMAseal/MIME encrypted message.\r\n\r\n'
        content += `--${this.boundary}\r\n`
        content += 'Content-Type: application/irmaseal\r\n'
        content += 'Content-Transfer-Encoding: base64\r\n\r\n'
        content += `${version}\r\n\r\n`
        content += `--${this.boundary}\r\n`
        content += 'Content-Type: application/octet-stream\r\n'
        content += 'Content-Transfer-Encoding: base64\r\n\r\n'
        content += `${encryptedData}\r\n\r\n`
        content += `--${this.boundary}--\r\n`
        return content
    }

    /**
     * Returns the MIME header
     */
    getMimeHeader(): string {
        if (!this.ct) throw new Error('No ciphertext')
        const headers = {
            ...(this.subject && { Subject: `${this.subject}` }),
            ...(this.recipient && { To: `${this.recipient}` }),
            ...(this.sender && { From: `${this.sender}` }),
            'MIME-Version': '1.0',
            'Content-Type': `multipart/encrypted; protocol="application/irmaseal"; boundary=${this.boundary}`,
        }

        let headerStr = ''
        for (const [k, v] of Object.entries(headers)) {
            headerStr += `${k}: ${v}\r\n`
        }
        headerStr += '\r\n\r\n'
        return headerStr
    }

    /**
     * Returns both the Mime header and body concatonated
     */
    getMimeMail(): string {
        return `${this.getMimeHeader()}\n${this.getMimeBody()}`
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
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

        for (let i = 0; i < 30; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length))

        return text
    }
}
