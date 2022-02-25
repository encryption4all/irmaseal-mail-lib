interface IComposeIrmaSealMail {
    addRecipient(recipient: string): void // need to update logic later to support multiple recipients
    setSender(sender: string): void
    setSubject(subject: string): void
    setPayload(ct: Uint8Array): void
    getMimeMail(): string
    getMimeHeader(): string
    getMimeBody(): string
}

export class ComposeMail implements IComposeIrmaSealMail {
    private recipients: string[]
    private ccRecipients: string[]
    private bccRecipients: string[]
    private sender: string
    private subject: string
    private payload: Uint8Array
    readonly boundary: string
    readonly boundaryAlt: string

    constructor() {
        this.boundary = this.generateBoundary()
        this.boundaryAlt = this.generateBoundary()
        this.recipients = Array()
        this.ccRecipients = Array()
        this.bccRecipients = Array()
    }

    /**
     * Adds a recipient to the mail
     * Currently, only one recipient is supported.
     * @param {string} recipient, mail address of the recipient
     */
    addRecipient(recipient: string): void {
        this.recipients.push(recipient)
    }
    
    addCcRecipient(recipient: string): void {
        this.ccRecipients.push(recipient)
    }
    
    addBccRecipient(recipient: string): void {
        this.bccRecipients.push(recipient)
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
        if (!this.payload) throw new Error('No ciphertext')

        const b64encoded = Buffer.from(this.payload).toString('base64')
        const encryptedData = b64encoded.replace(/(.{79})/g, '$1\r\n')

        let content = `--${this.boundary}\r\n`
        content += `Content-Type: multipart/alternative; boundary=${this.boundaryAlt}\r\n\r\n`
        content += `--${this.boundaryAlt}\r\n`
        content += 'Content-Type: text/plain\r\n\r\n'
        content +=
            "This is an IRMAseal/MIME encrypted message. See https://irma.app for more details.\r\n\r\n"
        content += `--${this.boundaryAlt}\r\n`
        content += 'Content-Type: text/html\r\n\r\n'
        content +=
            "<h1>IRMASeal mail</h1><p>This is an IRMAseal/MIME encrypted message.</p><p><a href='irma.app'>irma.app</a></p>\r\n\r\n"
        content += `--${this.boundaryAlt}\r\n\r\n`
        content += `--${this.boundary}\r\n`
        content += 'Content-Type: application/irmaseal; name="irmaseal.encrypted"\r\n\r\n'
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
            ...(this.recipients.length > 0 && { To: `${this.recipients.toString()}` }),
            ...(this.ccRecipients.length > 0 && { Cc: `${this.ccRecipients.toString()}` }),
            ...(this.bccRecipients.length > 0 && { Bcc: `${this.bccRecipients.toString()}` }),
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
     * Returns the Mime header, body and attachments concatonated
     * @param, whether or not to include the MIME version in the headers (default = true)
     */
    getMimeMail(includeVersion: boolean = true): string {
        return `${this.getMimeHeader(
            includeVersion
        )}\r\n${this.getMimeBody()}--${this.boundary
            }--`
    }

    /**
     * Sets the ciphertext of the mail
     * @param {string} ct, the ciphertext
     */
    setPayload(ct: Uint8Array): void {
        this.payload = ct
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
