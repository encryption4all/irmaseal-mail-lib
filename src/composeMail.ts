interface IComposeIrmaSealMail {
    addRecipient(recipient: string): void // need to update logic later to support multiple recipients
    setSender(sender: string): void
    setSubject(subject: string): void
    setPayload(payload: Uint8Array): void
    getMimeMail(): string
    getMimeHeader(): string
    getMimeBody(): string
    getPlainText(): string
    getHtmlText(): string
    getHtmlTextB64(): string
    getPlainTextB64(): string
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
    readonly boundaryRelated: string

    constructor() {
        this.boundary = this.generateBoundary()
        this.boundaryAlt = this.generateBoundary()
        this.boundaryRelated = this.generateBoundary()
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
        content += 'Content-Type: text/plain\r\n'
        content += 'Content-Transfer-Encoding: base64\r\n\r\n'
        content += `${this.getPlainTextB64()}\r\n\r\n`
        content += `--${this.boundaryAlt}\r\n`
        content += 'Content-Type: text/html; charset=UTF-8\r\n'
        content += 'Content-Transfer-Encoding: base64\r\n\r\n'
        content += `${this.getHtmlTextB64()}\r\n\r\n`
        content += `--${this.boundaryAlt}\r\n\r\n`
        content += `--${this.boundary}\r\n`
        content +=
            'Content-Type: application/postguard; name="postguard.encrypted"\r\n'
        content += 'Content-Transfer-Encoding: base64"\r\n\r\n'
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
            ...(this.recipients.length > 0 && {
                To: `${this.recipients.toString()}`,
            }),
            ...(this.ccRecipients.length > 0 && {
                Cc: `${this.ccRecipients.toString()}`,
            }),
            ...(this.bccRecipients.length > 0 && {
                Bcc: `${this.bccRecipients.toString()}`,
            }),
            ...(this.sender && { From: `${this.sender}` }),
            ...(includeVersion && { 'MIME-Version': '1.0' }),
            'Content-Type': `multipart/encrypted; protocol="application/postguard"; boundary=${this.boundary}`,
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
        )}\r\n${this.getMimeBody()}--${this.boundary}--`
    }

    /**
     * Sets the ciphertext of the mail
     * @param {string} payload, the ciphertext
     */
    setPayload(payload: Uint8Array): void {
        this.payload = payload
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

        for (let i = 0; i< 30; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length))

        return text
    }

    getPlainText(): string {
        if (!this.sender) throw new Error('No sender')

        return `
You received a PostGuard encrypted email from ${this.sender}.
There are three ways to read this protected email:
1) If you use Outlook and have already installed PostGuard, click on the "Decrypt Email"-button. 
This button can be found on the right side of the ribbon above.
2) You can decrypt and read this email via https://www.postguard.eu/#decrypt.
This website can only decrypt emails.
3) You can install the free PostGuard addon in your own mail client.
This works for Outlook and Thunderbird.
Download PostGuard via: https://www.postguard.eu/#addons.
After installation, you can not only decrypt and read this email but also all future Postguard emails. 
Moreover, you can easily send secure emails with the PostGuard addon within your email client.

What is PostGuard?

PostGuard is a service for secure emailing. Only the intended recipient(s) can decrypt\r\nand read the emails sent with PostGuard. 
The "Encryption for all"-team of the Radboud University has developed PostGuard.\r\nPostGuard uses the IRMA app for authentication. 
More information via: https://www.postguard.eu.

What is the IRMA app?

When you receive a PostGuarded email, you need to use the IRMA app to prove that you
really are the intended recipient of the email.
IRMA is a separate privacy-friendly authentication app
(which is used also for other authentication purposes).
The free IMRA app can be downloaded via the App Store and Play Store.
More information via: https://irma.app.`
    }

    getPlainTextB64(): string {
        return btoa(this.getPlainText()).replace(/(.{76})/g, '$1\r\n')
    }

    getHtmlTextB64(): string {
        return btoa(this.getHtmlText()).replace(/(.{76})/g, '$1\r\n')
    }

    getHtmlText(): string {
        if (!this.sender) throw new Error('No sender')

        return `
<!DOCTYPE html>
<html lang="en">
    <head>
        <title>PostGuard encrypted email</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta charset="UTF-8" />
        <link href="https://overpass-30e2.kxcdn.com/overpass.css" rel="stylesheet" type="text/css" />
        <link href="http://fonts.cdnfonts.com/css/sf-pro-display" rel="stylesheet" />
        <style>
      body {
        color: #022e3d;
        font-family: "Overpass", Arial;
        font-style: normal;
        margin: 0;
      }
      a {
        color: #0071eb;
        font-weight: bold;
      }
      .numberCounter {
        background: #0071eb;
        border-radius: 60%;
        color: white;
        width: 25px;
        text-align: center;
        font-family: "SF Pro Display";
        font-style: normal;
        font-weight: 400;
        font-size: 12px;
        line-height: 24px;
        height: 24px;
        float: left;
        clear: none;
      }
      .outer {
        margin-top: 15px;
      }
        </style>
    </head>

    <body style="background-color: #eaeaea; text-align: center">
        <div style="
        position: absolute;
        transform: translateX(16%);
        width: 75%;
        background-color: #ffffff;
        text-align: center;
      ">
            <div style="text-align: left; background-color: #20446b; height: 40px">
                <svg style="margin-top: 3px; margin-left: 14px"
                    xmlns="http://www.w3.org/2000/svg" height="34px" viewBox="0 0 38.27 44.64" fill="none">
                    <defs>
                        <style>
              .cls-1 {
                fill: #fff;
              }
              .cls-2 {
                fill: #0071eb;
              }
              .cls-3 {
                fill: #022e3d;
              }
              .cls-4 {
                fill: #181817;
              }
                        </style>
                    </defs>
                    <g id="Laag_1">
                        <g>
                            <g>
                                <path class="cls-2" d="M34.83,23.52c.06-.16,.1-.33,.16-.5,2.06-7.1,2.71-13.24,2.71-13.24h0c-4.01-1.9-14.74-7.4-18.56-9.21C14.19,3.13,5.59,7.2,.57,9.78h0s3.3,31.12,18.56,34.29h0c7.5-1.56,12.1-9.86,14.86-17.89" />
                                <path class="cls-4" d="M19.13,44.64c-.05,0-.11,0-.16-.02C3.51,41.35,.14,11.13,0,9.84c-.02-.23,.1-.46,.31-.57,2.46-1.27,5.83-2.91,9.09-4.51C12.82,3.09,16.35,1.37,18.87,.06c.16-.08,.34-.08,.5,0,1.88,.89,5.35,2.63,9.02,4.48,3.69,1.85,7.5,3.77,9.54,4.73,.27,.08,.36,.3,.33,.58,0,.06-.68,6.27-2.73,13.34l-.07,.23c-.03,.1-.06,.21-.1,.3-.11,.3-.43,.45-.73,.34-.3-.11-.45-.43-.34-.73,.03-.08,.05-.16,.08-.25l.08-.24c1.72-5.94,2.46-11.27,2.64-12.72-2.2-1.05-5.76-2.83-9.2-4.56-3.5-1.76-6.82-3.43-8.74-4.35-2.52,1.3-5.94,2.97-9.26,4.59-3.1,1.51-6.29,3.08-8.7,4.31,.46,3.67,4.24,30.39,17.95,33.38,5.97-1.3,10.78-7.19,14.31-17.5,.1-.3,.42-.46,.72-.35,.3,.1,.46,.43,.35,.72-3.7,10.78-8.84,16.93-15.28,18.27-.04,0-.08,.01-.12,.01Z" />
                            </g>
                            <path class="cls-1" d="M7.09,31.83l20.68,2.01s-.83,5.21-1.51,5.86-5.28,4.3-7.17,4.13c-1.89-.17-10.86-5.58-11.99-12Z" />
                            <path class="cls-4" d="M19.13,44.64c-.05,0-.11,0-.16-.02C3.51,41.35,.14,11.13,0,9.84c-.02-.23,.1-.46,.31-.57,2.46-1.27,5.83-2.91,9.09-4.51C12.82,3.09,16.35,1.37,18.87,.06c.16-.08,.34-.08,.5,0,1.88,.89,5.35,2.63,9.02,4.48,3.69,1.85,7.5,3.77,9.54,4.73,.27,.08,.36,.3,.33,.58,0,.06-.68,6.27-2.73,13.34l-.07,.23c-.03,.1-.06,.21-.1,.3-.11,.3-.43,.45-.73,.34-.3-.11-.45-.43-.34-.73,.03-.08,.05-.16,.08-.25l.08-.24c1.72-5.94,2.46-11.27,2.64-12.72-2.2-1.05-5.76-2.83-9.2-4.56-3.5-1.76-6.82-3.43-8.74-4.35-2.52,1.3-5.94,2.97-9.26,4.59-3.1,1.51-6.29,3.08-8.7,4.31,.46,3.67,4.24,30.39,17.95,33.38,5.97-1.3,10.78-7.19,14.31-17.5,.1-.3,.42-.46,.72-.35,.3,.1,.46,.43,.35,.72-3.7,10.78-8.84,16.93-15.28,18.27-.04,0-.08,.01-.12,.01Z" />
                            <polygon class="cls-1" points="29.41 20.7 35.54 23.26 36.41 25.19 28.26 27.54 29.41 20.7" />
                            <path class="cls-1" d="M19.13,43.14c-.05,0-.11,0-.16-.02C4.42,40.04,1.25,11.61,1.12,10.4c-.02-.23,.1-.46,.31-.57,2.31-1.19,5.48-2.74,8.55-4.24,3.21-1.57,6.53-3.19,8.89-4.41,.16-.08,.34-.09,.5,0,1.77,.84,5.03,2.48,8.48,4.21,3.46,1.74,7.05,3.54,8.96,4.45,.25,.08,.36,.31,.33,.58,0,.06-.64,5.89-2.57,12.54l-.07,.22c-.03,.1-.06,.19-.09,.29-.1,.3-.43,.46-.73,.34-.3-.1-.45-.43-.34-.73,.03-.08,.05-.15,.07-.23l.07-.23c1.61-5.54,2.3-10.52,2.47-11.93-2.06-.98-5.39-2.66-8.62-4.28-3.28-1.65-6.4-3.21-8.2-4.08-2.36,1.22-5.57,2.79-8.68,4.31-2.9,1.42-5.9,2.88-8.16,4.04,.44,3.53,4.01,28.51,16.83,31.32,5.59-1.23,10.1-6.75,13.42-16.42,.1-.3,.43-.46,.72-.35,.3,.1,.46,.43,.35,.72-3.48,10.14-8.32,15.93-14.38,17.19-.04,0-.08,.01-.12,.01Z" />
                            <path class="cls-3" d="M19.13,44.64c-.05,0-.11,0-.16-.02C3.51,41.35,.14,11.13,0,9.84c-.02-.23,.1-.46,.31-.57,2.46-1.27,5.83-2.91,9.09-4.51C12.82,3.09,16.35,1.37,18.87,.06c.16-.08,.34-.08,.5,0,1.88,.89,5.35,2.63,9.02,4.48,3.69,1.85,7.5,3.77,9.54,4.73,.27,.08,.36,.3,.33,.58,0,.06-.68,6.27-2.73,13.34l-.07,.23c-.03,.1-.06,.21-.1,.3-.11,.3-.43,.45-.73,.34-.3-.11-.45-.43-.34-.73,.03-.08,.05-.16,.08-.25l.08-.24c1.72-5.94,2.46-11.27,2.64-12.72-2.2-1.05-5.76-2.83-9.2-4.56-3.5-1.76-6.82-3.43-8.74-4.35-2.52,1.3-5.94,2.97-9.26,4.59-3.1,1.51-6.29,3.08-8.7,4.31,.46,3.67,4.24,30.39,17.95,33.38,5.97-1.3,10.78-7.19,14.31-17.5,.1-.3,.42-.46,.72-.35,.3,.1,.46,.43,.35,.72-3.7,10.78-8.84,16.93-15.28,18.27-.04,0-.08,.01-.12,.01Z" />
                            <path class="cls-3" d="M29.19,28.53c-.23,0-.45-.14-.53-.37-.11-.29,.04-.62,.33-.73l6.94-2.58c.05-.02,.08-.06,.08-.12s-.02-.1-.08-.12l-6.4-2.75c-.29-.12-.42-.46-.3-.75,.12-.29,.46-.43,.75-.3l6.4,2.75c.48,.2,.78,.67,.76,1.19-.01,.52-.34,.97-.82,1.15l-6.94,2.58c-.07,.02-.13,.04-.2,.04Z" />
                            <g>
                                <path class="cls-1" d="M28,34.11l.2-1.6,.57-4.55,.89-7.04c.06-.43,.08-.85,.08-1.27,0-5.02-3.75-9.4-8.87-10.04-5.54-.71-10.61,3.23-11.31,8.78l-1.06,8.33,.02-.16s-.38,3.11-1.44,6.05" />
                                <path class="cls-3" d="M28.57,34.18l-1.13-.14,1.67-13.18c.05-.39,.08-.78,.08-1.2,0-4.81-3.6-8.88-8.37-9.48-5.22-.66-10.01,3.05-10.68,8.28l-1.04,8.17h0c-.02,.13-.4,3.21-1.47,6.17l-1.07-.39c.9-2.47,1.3-5.11,1.39-5.77h0s1.06-8.33,1.06-8.33c.75-5.86,6.1-10.01,11.95-9.27,5.34,.66,9.36,5.22,9.36,10.61,0,.47-.03,.91-.08,1.35l-1.67,13.18Z" />
                            </g>
                            <path class="cls-3" d="M22.62,19.93c.49-1.33,2.45-1.26,2.89,.09,.13,.39,.19,.8,.16,1.24-.04,.49-.2,.94-.42,1.33-.74,1.34-2.77,.96-2.91-.57-.02-.24-.02-.49,0-.77,.04-.5,.14-.94,.28-1.32Z" />
                            <path class="cls-3" d="M24.96,41.74c-.14,0-.28-.05-.38-.15-.23-.21-.25-.57-.03-.8,2.44-2.66,2.96-7.29,2.97-7.34,.03-.31,.31-.54,.63-.51,.31,.03,.54,.31,.51,.63-.02,.2-.56,5.05-3.26,7.99-.11,.12-.27,.18-.42,.18Z" />
                            <path class="cls-3" d="M21.05,18.4c-.12,0-.24-.04-.34-.11-.25-.19-.3-.54-.12-.79,.05-.06,1.12-1.49,2.82-1.74,1.01-.15,1.99,.14,2.94,.86,.25,.19,.3,.55,.11,.8-.19,.25-.54,.3-.8,.11-.97-.73-1.95-.86-2.91-.38-.77,.38-1.25,1.02-1.26,1.03-.11,.15-.28,.23-.46,.23Z" />
                        </g>
                    </g>
                </svg>
            </div>
            <div style="margin: 20px">
                <div style="margin-top: 54px">
                    <div style="font-weight: 700; font-size: 24px; line-height: 30px">
            You received a PostGuard encrypted email from
                    </div>
                    <div style="
              margin-top: 12px;
              font-weight: 300;
              font-size: 18px;
              line-height: 24px;
              color: #0071eb;
            ">
            ${this.sender}
                    </div>
                </div>
                <div style="
            margin-left: 70px;
            font-weight: 300;
            margin-top: 30px;
            width: 75%;
            text-align: left;
            font-size: 14px;
            line-height: 24px;
          ">
                    <div style="font-weight: 700; font-size: 14px; line-height: 24px">
            There are two ways to decrypt and read this protected email.
                    </div>

                    <div class="outer">
                        <div class="numberCounter">1</div>
                        <div style="margin-left: 34px">
                            <p>
                You can use the free PostGuard add-on that is available
                (currently only) for Outlook and Thunderbird. It is available
                via
                                <a href="https://www.postguard.eu/#addons">www.postguard.eu</a>.
                After installation, you can not only decrypt and read this email but also all future emails encrypted with PostGuard. 
                Moreover, you can easily send secure emails yourself with the PostGuard add-on.
                            </p>
                            <p>
                                <span style="font-weight: 700; font-size: 14px">Already installed PostGuard? Click on the "Decrypt Email"
                  button.</span
                >
                                <br />
                This button can be found on the right side of the above menu.
                            </p>
                        </div>
                    </div>
                    <div class="outer">
                        <div class="numberCounter">2</div>
                        <div style="margin-left: 34px">
              You can also decrypt and read this email via the fallback website
                            <a href="https://www.postguard.eu/#fallback">www.postguard.eu/#fallback</a
              >. This website only decrypts the mail, and cannot be used for
              replying. PostGuard works better with its add-on than with this
              website.
                        </div>
                    </div>
                </div>

                <div style="
            text-align: left;
            margin-top: 50px;
            margin-left: 90px;
            width: 75%;
          ">
                    <div style="margin-left: -15px; height: 20px; float: left; clear: none">
                        <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 0 38.27 44.64">
                            <defs>
                                <style>
        .cls-1 {
            fill: #fff;
        }

        .cls-2 {
            fill: #0071eb;
        }

        .cls-3 {
            fill: #022e3d;
        }

        .cls-4 {
            fill: #181817;
        }
                                </style>
                            </defs>
                            <g id="Laag_1">
                                <g>
                                    <g>
                                        <path class="cls-2" d="M34.83,23.52c.06-.16,.1-.33,.16-.5,2.06-7.1,2.71-13.24,2.71-13.24h0c-4.01-1.9-14.74-7.4-18.56-9.21C14.19,3.13,5.59,7.2,.57,9.78h0s3.3,31.12,18.56,34.29h0c7.5-1.56,12.1-9.86,14.86-17.89" />
                                        <path class="cls-4" d="M19.13,44.64c-.05,0-.11,0-.16-.02C3.51,41.35,.14,11.13,0,9.84c-.02-.23,.1-.46,.31-.57,2.46-1.27,5.83-2.91,9.09-4.51C12.82,3.09,16.35,1.37,18.87,.06c.16-.08,.34-.08,.5,0,1.88,.89,5.35,2.63,9.02,4.48,3.69,1.85,7.5,3.77,9.54,4.73,.27,.08,.36,.3,.33,.58,0,.06-.68,6.27-2.73,13.34l-.07,.23c-.03,.1-.06,.21-.1,.3-.11,.3-.43,.45-.73,.34-.3-.11-.45-.43-.34-.73,.03-.08,.05-.16,.08-.25l.08-.24c1.72-5.94,2.46-11.27,2.64-12.72-2.2-1.05-5.76-2.83-9.2-4.56-3.5-1.76-6.82-3.43-8.74-4.35-2.52,1.3-5.94,2.97-9.26,4.59-3.1,1.51-6.29,3.08-8.7,4.31,.46,3.67,4.24,30.39,17.95,33.38,5.97-1.3,10.78-7.19,14.31-17.5,.1-.3,.42-.46,.72-.35,.3,.1,.46,.43,.35,.72-3.7,10.78-8.84,16.93-15.28,18.27-.04,0-.08,.01-.12,.01Z" />
                                    </g>
                                    <path class="cls-1" d="M7.09,31.83l20.68,2.01s-.83,5.21-1.51,5.86-5.28,4.3-7.17,4.13c-1.89-.17-10.86-5.58-11.99-12Z" />
                                    <path class="cls-4" d="M19.13,44.64c-.05,0-.11,0-.16-.02C3.51,41.35,.14,11.13,0,9.84c-.02-.23,.1-.46,.31-.57,2.46-1.27,5.83-2.91,9.09-4.51C12.82,3.09,16.35,1.37,18.87,.06c.16-.08,.34-.08,.5,0,1.88,.89,5.35,2.63,9.02,4.48,3.69,1.85,7.5,3.77,9.54,4.73,.27,.08,.36,.3,.33,.58,0,.06-.68,6.27-2.73,13.34l-.07,.23c-.03,.1-.06,.21-.1,.3-.11,.3-.43,.45-.73,.34-.3-.11-.45-.43-.34-.73,.03-.08,.05-.16,.08-.25l.08-.24c1.72-5.94,2.46-11.27,2.64-12.72-2.2-1.05-5.76-2.83-9.2-4.56-3.5-1.76-6.82-3.43-8.74-4.35-2.52,1.3-5.94,2.97-9.26,4.59-3.1,1.51-6.29,3.08-8.7,4.31,.46,3.67,4.24,30.39,17.95,33.38,5.97-1.3,10.78-7.19,14.31-17.5,.1-.3,.42-.46,.72-.35,.3,.1,.46,.43,.35,.72-3.7,10.78-8.84,16.93-15.28,18.27-.04,0-.08,.01-.12,.01Z" />
                                    <polygon class="cls-1" points="29.41 20.7 35.54 23.26 36.41 25.19 28.26 27.54 29.41 20.7" />
                                    <path class="cls-1" d="M19.13,43.14c-.05,0-.11,0-.16-.02C4.42,40.04,1.25,11.61,1.12,10.4c-.02-.23,.1-.46,.31-.57,2.31-1.19,5.48-2.74,8.55-4.24,3.21-1.57,6.53-3.19,8.89-4.41,.16-.08,.34-.09,.5,0,1.77,.84,5.03,2.48,8.48,4.21,3.46,1.74,7.05,3.54,8.96,4.45,.25,.08,.36,.31,.33,.58,0,.06-.64,5.89-2.57,12.54l-.07,.22c-.03,.1-.06,.19-.09,.29-.1,.3-.43,.46-.73,.34-.3-.1-.45-.43-.34-.73,.03-.08,.05-.15,.07-.23l.07-.23c1.61-5.54,2.3-10.52,2.47-11.93-2.06-.98-5.39-2.66-8.62-4.28-3.28-1.65-6.4-3.21-8.2-4.08-2.36,1.22-5.57,2.79-8.68,4.31-2.9,1.42-5.9,2.88-8.16,4.04,.44,3.53,4.01,28.51,16.83,31.32,5.59-1.23,10.1-6.75,13.42-16.42,.1-.3,.43-.46,.72-.35,.3,.1,.46,.43,.35,.72-3.48,10.14-8.32,15.93-14.38,17.19-.04,0-.08,.01-.12,.01Z" />
                                    <path class="cls-3" d="M19.13,44.64c-.05,0-.11,0-.16-.02C3.51,41.35,.14,11.13,0,9.84c-.02-.23,.1-.46,.31-.57,2.46-1.27,5.83-2.91,9.09-4.51C12.82,3.09,16.35,1.37,18.87,.06c.16-.08,.34-.08,.5,0,1.88,.89,5.35,2.63,9.02,4.48,3.69,1.85,7.5,3.77,9.54,4.73,.27,.08,.36,.3,.33,.58,0,.06-.68,6.27-2.73,13.34l-.07,.23c-.03,.1-.06,.21-.1,.3-.11,.3-.43,.45-.73,.34-.3-.11-.45-.43-.34-.73,.03-.08,.05-.16,.08-.25l.08-.24c1.72-5.94,2.46-11.27,2.64-12.72-2.2-1.05-5.76-2.83-9.2-4.56-3.5-1.76-6.82-3.43-8.74-4.35-2.52,1.3-5.94,2.97-9.26,4.59-3.1,1.51-6.29,3.08-8.7,4.31,.46,3.67,4.24,30.39,17.95,33.38,5.97-1.3,10.78-7.19,14.31-17.5,.1-.3,.42-.46,.72-.35,.3,.1,.46,.43,.35,.72-3.7,10.78-8.84,16.93-15.28,18.27-.04,0-.08,.01-.12,.01Z" />
                                    <path class="cls-3" d="M29.19,28.53c-.23,0-.45-.14-.53-.37-.11-.29,.04-.62,.33-.73l6.94-2.58c.05-.02,.08-.06,.08-.12s-.02-.1-.08-.12l-6.4-2.75c-.29-.12-.42-.46-.3-.75,.12-.29,.46-.43,.75-.3l6.4,2.75c.48,.2,.78,.67,.76,1.19-.01,.52-.34,.97-.82,1.15l-6.94,2.58c-.07,.02-.13,.04-.2,.04Z" />
                                    <g>
                                        <path class="cls-1" d="M28,34.11l.2-1.6,.57-4.55,.89-7.04c.06-.43,.08-.85,.08-1.27,0-5.02-3.75-9.4-8.87-10.04-5.54-.71-10.61,3.23-11.31,8.78l-1.06,8.33,.02-.16s-.38,3.11-1.44,6.05" />
                                        <path class="cls-3" d="M28.57,34.18l-1.13-.14,1.67-13.18c.05-.39,.08-.78,.08-1.2,0-4.81-3.6-8.88-8.37-9.48-5.22-.66-10.01,3.05-10.68,8.28l-1.04,8.17h0c-.02,.13-.4,3.21-1.47,6.17l-1.07-.39c.9-2.47,1.3-5.11,1.39-5.77h0s1.06-8.33,1.06-8.33c.75-5.86,6.1-10.01,11.95-9.27,5.34,.66,9.36,5.22,9.36,10.61,0,.47-.03,.91-.08,1.35l-1.67,13.18Z" />
                                    </g>
                                    <path class="cls-3" d="M22.62,19.93c.49-1.33,2.45-1.26,2.89,.09,.13,.39,.19,.8,.16,1.24-.04,.49-.2,.94-.42,1.33-.74,1.34-2.77,.96-2.91-.57-.02-.24-.02-.49,0-.77,.04-.5,.14-.94,.28-1.32Z" />
                                    <path class="cls-3" d="M24.96,41.74c-.14,0-.28-.05-.38-.15-.23-.21-.25-.57-.03-.8,2.44-2.66,2.96-7.29,2.97-7.34,.03-.31,.31-.54,.63-.51,.31,.03,.54,.31,.51,.63-.02,.2-.56,5.05-3.26,7.99-.11,.12-.27,.18-.42,.18Z" />
                                    <path class="cls-3" d="M21.05,18.4c-.12,0-.24-.04-.34-.11-.25-.19-.3-.54-.12-.79,.05-.06,1.12-1.49,2.82-1.74,1.01-.15,1.99,.14,2.94,.86,.25,.19,.3,.55,.11,.8-.19,.25-.54,.3-.8,.11-.97-.73-1.95-.86-2.91-.38-.77,.38-1.25,1.02-1.26,1.03-.11,.15-.28,.23-.46,.23Z" />
                                </g>
                            </g>
                        </svg>
                    </div>
                    <div style="margin-left: 14px">
                        <div style="font-weight: 700; font-size: 14px; line-height: 24px">
              What is PostGuard?
                        </div>

                        <div style="font-weight: 300; font-size: 12px; line-height: 20px">
              PostGuard is a service for secure emailing and file sharing. Only
              the intended recipient(s) can decrypt and read the emails or files
              sent with PostGuard. With PostGuard your emails and files are
              end-to-end encrypted. The "Encryption for all"-team of the Radboud
              University has developed PostGuard.
                            <br />
                            <a href="https://postguard.eu">More information about PostGuard</a
              >
                        </div>
                    </div>
                </div>

                <div style="
            text-align: left;
            margin-top: 25px;
            margin-left: 70px;
            width: 75%;
          ">
                    <div style="height: 22px; width: 20px; float: left; clear: none">
                        <svg height="22px" viewBox="0 0 170 170" version="1.1"
                            xmlns="http://www.w3.org/2000/svg"
                            xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve"
                            xmlns:serif="http://www.serif.com/" style="
                fill-rule: evenodd;
                clip-rule: evenodd;
                stroke-linejoin: round;
                stroke-miterlimit: 1.41421;
              ">
                            <g transform="matrix(1,0,0,1,-0.588574,-0.544313)">
                                <g id="Rounded_Rectangle_1_1_" transform="matrix(0.945114,-0.32674,0.32674,0.945114,-8.94903,58.0541)">
                                    <g transform="matrix(0.945114,0.32674,-0.32674,0.945114,23.6518,-9.46055)">
                                        <path d="M33.906,116.205C29.989,116.205 26.567,113.866 25.389,110.385L4.684,49.145C3.134,44.563 5.885,39.476 10.816,37.805L109.378,4.405C110.432,4.048 111.523,3.866 112.619,3.866C116.536,3.866 119.959,6.205 121.137,9.687L141.842,70.926C143.392,75.507 140.641,80.595 135.71,82.267L37.147,115.666C36.093,116.024 35.003,116.205 33.906,116.205L33.906,116.205Z" style="fill: #d44454; fill-rule: nonzero" />
                                        <path d="M112.619,7.116C115.084,7.116 117.302,8.492 118.057,10.728L138.762,71.967C139.74,74.857 137.906,78.09 134.665,79.189L36.103,112.588C35.369,112.837 34.627,112.954 33.905,112.954C31.44,112.954 29.222,111.578 28.466,109.343L7.762,48.104C6.784,45.214 8.619,41.98 11.859,40.883L110.421,7.483C111.154,7.234 111.897,7.116 112.619,7.116M112.619,0.616C111.167,0.616 109.725,0.855 108.335,1.326L9.773,34.726C3.145,36.972 -0.519,43.907 1.605,50.186L22.31,111.424C23.935,116.227 28.595,119.453 33.907,119.453C35.359,119.453 36.801,119.215 38.192,118.743L136.753,85.344C143.381,83.097 147.045,76.161 144.921,69.883L124.214,8.646C122.59,3.843 117.93,0.616 112.619,0.616Z" style="fill: #d44454; fill-rule: nonzero" />
                                    </g>
                                    <g transform="matrix(0.945114,0.32674,-0.32674,0.945114,38.5375,-37.9081)">
                                        <path d="M33.906,116.205C29.989,116.205 26.567,113.866 25.389,110.385L4.684,49.145C3.134,44.563 5.885,39.476 10.816,37.805L109.378,4.405C110.432,4.048 111.523,3.866 112.619,3.866C116.536,3.866 119.959,6.205 121.137,9.687L141.842,70.926C143.392,75.507 140.641,80.595 135.71,82.267L37.147,115.666C36.093,116.024 35.003,116.205 33.906,116.205L33.906,116.205Z" style="fill: #ffbb58; fill-rule: nonzero" />
                                        <path d="M112.619,7.116C115.084,7.116 117.302,8.492 118.057,10.728L138.762,71.967C139.74,74.857 137.906,78.09 134.665,79.189L36.103,112.588C35.369,112.837 34.627,112.954 33.905,112.954C31.44,112.954 29.222,111.578 28.466,109.343L7.762,48.104C6.784,45.214 8.619,41.98 11.859,40.883L110.421,7.483C111.154,7.234 111.897,7.116 112.619,7.116M112.619,0.616C111.167,0.616 109.725,0.855 108.335,1.326L9.773,34.726C3.145,36.972 -0.519,43.907 1.605,50.186L22.31,111.424C23.935,116.227 28.595,119.453 33.907,119.453C35.359,119.453 36.801,119.215 38.192,118.743L136.753,85.344C143.381,83.097 147.045,76.161 144.921,69.883L124.214,8.646C122.59,3.843 117.93,0.616 112.619,0.616Z" style="fill: #ffbb58; fill-rule: nonzero" />
                                    </g>
                                    <g transform="matrix(0.872113,0.489304,-0.489304,0.872113,33.7109,-39.4445)">
                                        <path d="M33.906,116.205C29.989,116.205 26.567,113.866 25.389,110.385L4.684,49.145C3.134,44.563 5.885,39.476 10.816,37.805L109.378,4.405C110.432,4.048 111.523,3.866 112.619,3.866C116.536,3.866 119.959,6.205 121.137,9.687L141.842,70.926C143.392,75.507 140.641,80.595 135.71,82.267L37.147,115.666C36.093,116.024 35.003,116.205 33.906,116.205L33.906,116.205Z" style="fill: #2bc194; fill-rule: nonzero" />
                                        <path d="M112.619,7.116C115.084,7.116 117.302,8.492 118.057,10.728L138.762,71.967C139.74,74.857 137.906,78.09 134.665,79.189L36.103,112.588C35.369,112.837 34.627,112.954 33.905,112.954C31.44,112.954 29.222,111.578 28.466,109.343L7.762,48.104C6.784,45.214 8.619,41.98 11.859,40.883L110.421,7.483C111.154,7.234 111.897,7.116 112.619,7.116M112.619,0.616C111.167,0.616 109.725,0.855 108.335,1.326L9.773,34.726C3.145,36.972 -0.519,43.907 1.605,50.186L22.31,111.424C23.935,116.227 28.595,119.453 33.907,119.453C35.359,119.453 36.801,119.215 38.192,118.743L136.753,85.344C143.381,83.097 147.045,76.161 144.921,69.883L124.214,8.646C122.59,3.843 117.93,0.616 112.619,0.616Z" style="fill: #2bc194; fill-rule: nonzero" />
                                    </g>
                                    <g transform="matrix(0.876971,0.480544,-0.480544,0.876971,56.23,-21.0767)">
                                        <path d="M33.906,116.205C29.989,116.205 26.567,113.866 25.389,110.385L4.684,49.145C3.134,44.563 5.885,39.476 10.816,37.805L109.378,4.405C110.432,4.048 111.523,3.866 112.619,3.866C116.536,3.866 119.959,6.205 121.137,9.687L141.842,70.926C143.392,75.507 140.641,80.595 135.71,82.267L37.147,115.666C36.093,116.024 35.003,116.205 33.906,116.205L33.906,116.205Z" style="fill: #00b1e6; fill-rule: nonzero" />
                                        <path d="M112.619,7.116C115.084,7.116 117.302,8.492 118.057,10.728L138.762,71.967C139.74,74.857 137.906,78.09 134.665,79.189L36.103,112.588C35.369,112.837 34.627,112.954 33.905,112.954C31.44,112.954 29.222,111.578 28.466,109.343L7.762,48.104C6.784,45.214 8.619,41.98 11.859,40.883L110.421,7.483C111.154,7.234 111.897,7.116 112.619,7.116M112.619,0.616C111.167,0.616 109.725,0.855 108.335,1.326L9.773,34.726C3.145,36.972 -0.519,43.907 1.605,50.186L22.31,111.424C23.935,116.227 28.595,119.453 33.907,119.453C35.359,119.453 36.801,119.215 38.192,118.743L136.753,85.344C143.381,83.097 147.045,76.161 144.921,69.883L124.214,8.646C122.59,3.843 117.93,0.616 112.619,0.616Z" style="fill: #00b1e6; fill-rule: nonzero" />
                                    </g>
                                </g>
                                <g id="Rounded_Rectangle_1_1_1" serif:id="Rounded_Rectangle_1_1_" transform="matrix(1,0,0,1,12.3739,26.4544)">
                                    <g>
                                        <path d="M33.906,116.205C29.989,116.205 26.567,113.866 25.389,110.385L4.684,49.145C3.134,44.563 5.885,39.476 10.816,37.805L109.378,4.405C110.432,4.048 111.523,3.866 112.619,3.866C116.536,3.866 119.959,6.205 121.137,9.687L141.842,70.926C143.392,75.507 140.641,80.595 135.71,82.267L37.147,115.666C36.093,116.024 35.003,116.205 33.906,116.205L33.906,116.205Z" style="fill: #004c92; fill-rule: nonzero" />
                                        <path d="M112.619,7.116C115.084,7.116 117.302,8.492 118.057,10.728L138.762,71.967C139.74,74.857 137.906,78.09 134.665,79.189L36.103,112.588C35.369,112.837 34.627,112.954 33.905,112.954C31.44,112.954 29.222,111.578 28.466,109.343L7.762,48.104C6.784,45.214 8.619,41.98 11.859,40.883L110.421,7.483C111.154,7.234 111.897,7.116 112.619,7.116M112.619,0.616C111.167,0.616 109.725,0.855 108.335,1.326L9.773,34.726C3.145,36.972 -0.519,43.907 1.605,50.186L22.31,111.424C23.935,116.227 28.595,119.453 33.907,119.453C35.359,119.453 36.801,119.215 38.192,118.743L136.753,85.344C143.381,83.097 147.045,76.161 144.921,69.883L124.214,8.646C122.59,3.843 117.93,0.616 112.619,0.616Z" style="fill: #fff; fill-rule: nonzero" />
                                    </g>
                                </g>
                                <g id="IRMA_1_" transform="matrix(1,0,0,1,12.3739,26.4544)">
                                    <clipPath id="_clip1">
                                        <path d="M139.203,72.585L128.166,39.679L135.507,39.343L146.64,71.321L146.64,0L0,0L0,120.72L146.64,120.72L146.64,73.073L139.203,72.585Z" />
                                    </clipPath>
                                    <g clip-path="url(#_clip1)">
                                        <rect x="42.199" y="40.296" width="6.083" height="32.149" style="fill: #fff; fill-rule: nonzero" />
                                        <path d="M55.331,40.296L66.484,40.296C69.767,40.296 72.438,41.26 74.498,43.19C76.559,45.119 77.59,47.507 77.59,50.355C77.59,52.376 77.026,54.19 75.899,55.797C74.774,57.404 73.245,58.606 71.314,59.402L78.796,72.445L72.086,72.445L65.568,60.32L61.415,60.32L61.415,72.445L55.332,72.445L55.332,40.296L55.331,40.296ZM66.484,45.624L61.415,45.624L61.415,54.993L66.484,54.993C67.932,54.993 69.091,54.564 69.96,53.707C70.829,52.85 71.264,51.717 71.264,50.309C71.264,48.931 70.829,47.806 69.96,46.933C69.091,46.06 67.932,45.624 66.484,45.624Z" style="fill: #fff; fill-rule: nonzero" />
                                        <path d="M101.017,63.91L96.001,63.893L89.512,52.478L89.512,72.444L83.429,72.444L83.429,40.296L88.836,40.296L98.491,57.426L108.196,40.296L113.555,40.296L113.555,72.445L107.472,72.445L107.472,52.513L101.017,63.91Z" style="fill: #fff; fill-rule: nonzero" />
                                        <path d="M139.772,72.445L137.608,65.602L126.101,65.602L123.936,72.445L117.322,72.445L128.764,40.296L134.897,40.296L146.338,72.445L139.772,72.445ZM131.854,47.506L127.596,60.871L136.112,60.871L131.854,47.506Z" style="fill: #fff; fill-rule: nonzero" />
                                    </g>
                                </g>
                            </g>
                        </svg>
                    </div>

                    <div style="margin-left: 34px">
                        <div style="font-weight: 700; font-size: 14px; line-height: 24px">
              What is the IRMA app?
                        </div>
                        <div style="font-weight: 300; font-size: 12px; line-height: 20px">
              The IRMA app is a general-purpose privacy-friendly authentication
              app. You need the IRMA app with PostGuard to prove that you really
              are the intended recipient.<br />
                        <a href="https://irma.app">More information about IRMA</a>
                    </div>
                </div>
            </div>

            <div style="
            font-weight: 300;
            font-size: 14px;
            line-height: 20px;
            text-align: left;
            margin: 20px 0 0px 104px;
          ">
                <div style="
              font-style: normal;
              font-weight: 700;
              font-size: 14px;
              line-height: 24px;
            ">
            Download the free IRMA app:
                </div>

                <a href="https://apps.apple.com/us/app/irma-authentication/id1294092994" title="IRMA for iOS">App store</a
          >
          &nbsp; &nbsp; &nbsp;
                <a href="https://play.google.com/store/apps/details?id=org.irmacard.cardemu&gl=US" title="IRMA for Android">Google Play</a
          >
            </div>
        </div>
    </div>
</body>
</html>
`
    }
}
