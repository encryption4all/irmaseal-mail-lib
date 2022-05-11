interface IComposeIrmaSealMail {
    addRecipient(recipient: string): void // need to update logic later to support multiple recipients
    setSender(sender: string): void
    setSubject(subject: string): void
    setPayload(payload: Uint8Array): void
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
        content += 'Content-Type: text/plain\r\n\r\n'
        content +=
            `You received a PostGuard encrypted email from ${this.sender}
There are three ways to read this protected email:
1) If you use Outlook and have already installed PostGuard, click on the "Decrypt Email"-button. 
This button can be found on the right side of the ribbon above.
2) You can decrypt and read this email via https://www.postguard.eu/decrypt/.
This website can only decrypt emails.
3) You can install the free PostGuard addon in your own mail client.
This works for Outlook and Thunderbird.
Download PostGuard via: https://www.postguard.eu
After installation, you can not only decrypt and read emails but also all future Postguarded emails. 
Moreover, you can easily send and receive secure emails with the PostGuard addon within your email client.

What is PostGuard?

PostGuard is a service for secure emailing. Only the intended recipient(s) can decrypt\r\nand read the emails sent with PostGuard. 
The "Encryption for all"-team of the Radboud University has developed PostGuard.\r\nPostGuard uses the IRMA app for authentication. 
More information via: https://www.postguard.eu

What is the IRMA app?

When you receive a PostGuarded email, you need to use the IRMA app to prove that you
really are the intended recipient of the email.
IRMA is a separate privacy-friendly authentication app
(which is used also for other authentication purposes).
The free IMRA app can be downloaded via the App Store and Play Store.
More information via: https://irma.app\r\n\r\n`
        content += `--${this.boundaryAlt}\r\n`

        content += `Content-Type: multipart/related; boundary="${this.boundaryRelated}"\r\n\r\n`
        content += 'This is a multi-part message in MIME format\r\n'
        content += `--${this.boundaryRelated}\r\n`
        content += 'Content-Type: text/html; charset=UTF-8\r\n\r\n'
        content += `<!DOCTYPE html>
<html lang="en">

    <head>

        <title>PostGuard encrypted email</title>

        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <meta charset="UTF-8"/>

        <link href="https://overpass-30e2.kxcdn.com/overpass.css" rel="stylesheet" type="text/css"/>
        <link href="http://fonts.cdnfonts.com/css/sf-pro-display" rel="stylesheet"/>
        <style>
			body { color: #022E3D; font-family: 'Overpass', Arial; font-style: normal; margin: 0}
            a { color: #338265; font-weight: bold; }
            .numberCounter {
                background: #338265;
                border-radius: 60%;
                color: white;
                width: 25px;
                text-align: center;
                font-family: 'SF Pro Display';
                font-style: normal;
                font-weight: 400;
                font-size: 12px;
                line-height: 24px;
                height: 24px;
                float: left; clear: none
                
            }
            .outer {
                margin-top: 15px;
            }
        </style>
    </head>

    <body style="background-color:#EAEAEA; text-align: center;">

        <div style="position: absolute; transform: translateX(16%); width: 75%; background-color: #ffffff; text-align: center">

            <div style="text-align: left; background-color: #022E3D; height: 40px">
                <img style="margin-top: 3px; margin-left: 14px; height: 34px" alt="PostGuard" src="cid:pglogo"/>
            </div>
            <div style="margin: 20px">

                <div style="margin-top: 54px">
                    <div style="font-weight: 700; font-size: 24px; line-height: 30px;">You received a PostGuard encrypted email from</div>
                    <div style="margin-top: 12px; font-weight: 300; font-size: 18px; line-height: 24px; color: #338265">${this.sender}</div>
                </div>
                <div style="margin-left: 70px; font-weight: 300; margin-top: 30px; width: 75%; text-align: left; font-size: 14px; line-height: 24px;">
                    <div style="font-weight: 700; font-size: 14px; line-height: 24px;">There are two ways to decrypt and read this protected email.</div>

                    <div class="outer">
                        <div class="numberCounter">1</div>
                        <div style="margin-left: 34px">
                            <p>You can use the free PostGuard add-on that is available (currently only) for Outlook and Thunderbird.
                                    It is available via <a href="https://www.postguard.eu">www.postguard.eu</a>.
                                    After installation, you can not only decrypt and read the current email but also all future Postguarded emails.
                                    Moreover, you can easily send secure emails yourself with the PostGuard add-on.</p>
                            <p>
                                <span style="font-weight: 700; font-size: 14px;">Already installed PostGuard? Click on the "Decrypt Email" button.</span>
                                <br/>
This button can be found on the right side of the above menu.</p>
                        </div>
                    </div>
                    <div class="outer">
                        <div class="numberCounter">2</div>
                        <div style="margin-left: 34px">
                        You can also decrypt and read this email via the fallback website <a href="https://www.postguard.eu/decrypt/">www.postguard.eu/decrypt/</a>.
                        This website only decrypts the mail, and cannot be used for replying. PostGuards work better with its add-on than with this website.
                        </div>
                    </div>
                </div>

                <div style="text-align: left; margin-top: 50px; margin-left: 90px; width: 75%">

                    <div style="margin-left: -15px; height: 20px; float: left; clear: none;">
                        <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 0 410.31 478.63">
                            <defs>
                                <style>.d{fill:#fff;}.e{fill:#54d6a7;}.f{fill:#022e3d;}.g{fill:#181817;}</style>
                            </defs>
                            <g id="a"/>
                            <g id="b">
                                <g id="c">
                                    <g>
                                        <g>
                                            <path class="e" d="M373.43,252.21c.61-1.71,1.1-3.54,1.71-5.37,22.09-76.17,29.05-141.96,29.05-141.96l-.08-.03C361.08,84.5,246.1,25.52,205.12,6.11,152.14,33.51,59.9,77.18,6.07,104.86h.02S41.45,438.56,205.12,472.51h-.02c80.44-16.71,129.75-105.69,159.29-191.86"/>
                                            <path class="g" d="M205.1,478.63c-.58,0-1.16-.08-1.69-.24C37.69,443.4,1.49,119.29,.03,105.5c-.26-2.5,1.04-4.92,3.28-6.07,26.35-13.56,62.51-31.24,97.48-48.35C137.42,33.18,175.29,14.66,202.33,.68c1.67-.87,3.7-.91,5.41-.1,20.18,9.56,57.35,28.24,96.69,48.01,39.55,19.87,80.45,40.41,102.29,50.74,2.85,.82,3.85,3.23,3.54,6.19-.07,.67-7.27,67.2-29.25,143.02l-.79,2.49c-.33,1.11-.68,2.21-1.05,3.25-1.16,3.17-4.62,4.78-7.82,3.67-3.17-1.14-4.82-4.65-3.67-7.82,.31-.86,.58-1.75,.86-2.66l.82-2.6c18.46-63.68,26.33-120.81,28.26-136.44-23.61-11.24-61.72-30.38-98.66-48.94-37.57-18.88-73.15-36.75-93.73-46.6-26.99,13.9-63.74,31.86-99.31,49.25-33.2,16.23-67.47,32.99-93.3,46.19,4.89,39.34,45.46,325.89,192.51,357.93,63.96-13.98,115.59-77.1,153.49-187.61,1.08-3.19,4.55-4.9,7.75-3.79,3.19,1.08,4.89,4.57,3.79,7.75-39.65,115.61-94.76,181.52-163.83,195.87-.42,.1-.83,.13-1.24,.13Z"/>
                                        </g>
                                        <path class="d" d="M76,341.33l221.69,21.54s-8.92,55.85-16.15,62.84c-7.24,6.99-56.64,46.09-76.92,44.28-20.28-1.81-116.5-59.79-128.62-128.66Z"/>
                                        <path class="g" d="M205.1,478.63c-.58,0-1.16-.08-1.69-.24C37.69,443.4,1.49,119.29,.03,105.5c-.26-2.5,1.04-4.92,3.28-6.07,26.35-13.56,62.51-31.24,97.48-48.35C137.42,33.18,175.29,14.66,202.33,.68c1.67-.87,3.7-.91,5.41-.1,20.18,9.56,57.35,28.24,96.69,48.01,39.55,19.87,80.45,40.41,102.29,50.74,2.85,.82,3.85,3.23,3.54,6.19-.07,.67-7.27,67.2-29.25,143.02l-.79,2.49c-.33,1.11-.68,2.21-1.05,3.25-1.16,3.17-4.62,4.78-7.82,3.67-3.17-1.14-4.82-4.65-3.67-7.82,.31-.86,.58-1.75,.86-2.66l.82-2.6c18.46-63.68,26.33-120.81,28.26-136.44-23.61-11.24-61.72-30.38-98.66-48.94-37.57-18.88-73.15-36.75-93.73-46.6-26.99,13.9-63.74,31.86-99.31,49.25-33.2,16.23-67.47,32.99-93.3,46.19,4.89,39.34,45.46,325.89,192.51,357.93,63.96-13.98,115.59-77.1,153.49-187.61,1.08-3.19,4.55-4.9,7.75-3.79,3.19,1.08,4.89,4.57,3.79,7.75-39.65,115.61-94.76,181.52-163.83,195.87-.42,.1-.83,.13-1.24,.13Z"/>
                                        <polygon class="d" points="315.41 221.93 381.11 249.41 390.4 270.08 302.97 295.33 315.41 221.93"/>
                                        <path class="d" d="M205.11,462.56c-.58,0-1.16-.08-1.69-.24C47.44,429.34,13.39,124.52,12.02,111.55c-.26-2.5,1.04-4.92,3.28-6.07,24.78-12.75,58.8-29.38,91.69-45.47,34.4-16.82,69.97-34.21,95.35-47.33,1.67-.87,3.7-.92,5.41-.1,18.98,8.99,53.93,26.55,90.93,45.14,37.15,18.67,75.57,37.97,96.09,47.67,2.72,.91,3.83,3.34,3.53,6.19-.06,.62-6.84,63.19-27.51,134.48l-.73,2.32c-.32,1.04-.63,2.06-.99,3.06-1.11,3.17-4.6,4.9-7.8,3.7-3.17-1.12-4.83-4.61-3.7-7.8,.29-.81,.54-1.64,.8-2.5l.75-2.42c17.24-59.44,24.65-112.81,26.53-127.9-22.04-10.51-57.8-28.48-92.46-45.89-35.22-17.7-68.59-34.46-87.95-43.72-25.33,13.04-59.78,29.88-93.12,46.19-31.12,15.21-63.25,30.92-87.49,43.31,4.73,37.88,43,305.73,180.52,335.81,59.95-13.16,108.35-72.39,143.9-176.07,1.07-3.18,4.57-4.89,7.75-3.79,3.19,1.08,4.89,4.57,3.79,7.75-37.29,108.78-89.17,170.8-154.23,184.33-.42,.1-.83,.13-1.24,.13Z"/>
                                        <path class="f" d="M205.1,478.63c-.58,0-1.16-.08-1.69-.24C37.69,443.4,1.49,119.29,.03,105.5c-.26-2.5,1.04-4.92,3.28-6.07,26.35-13.56,62.51-31.24,97.48-48.35C137.42,33.18,175.29,14.66,202.33,.68c1.67-.87,3.7-.91,5.41-.1,20.18,9.56,57.35,28.24,96.69,48.01,39.55,19.87,80.45,40.41,102.29,50.74,2.85,.82,3.85,3.23,3.54,6.19-.07,.67-7.27,67.2-29.25,143.02l-.79,2.49c-.33,1.11-.68,2.21-1.05,3.25-1.16,3.17-4.62,4.78-7.82,3.67-3.17-1.14-4.82-4.65-3.67-7.82,.31-.86,.58-1.75,.86-2.66l.82-2.6c18.46-63.68,26.33-120.81,28.26-136.44-23.61-11.24-61.72-30.38-98.66-48.94-37.57-18.88-73.15-36.75-93.73-46.6-26.99,13.9-63.74,31.86-99.31,49.25-33.2,16.23-67.47,32.99-93.3,46.19,4.89,39.34,45.46,325.89,192.51,357.93,63.96-13.98,115.59-77.1,153.49-187.61,1.08-3.19,4.55-4.9,7.75-3.79,3.19,1.08,4.89,4.57,3.79,7.75-39.65,115.61-94.76,181.52-163.83,195.87-.42,.1-.83,.13-1.24,.13Z"/>
                                        <path class="f" d="M312.96,305.94c-2.48,0-4.8-1.51-5.72-3.97-1.17-3.16,.43-6.68,3.59-7.86l74.45-27.71c.57-.21,.87-.63,.88-1.24,.01-.61-.26-1.04-.81-1.28l-68.62-29.53c-3.1-1.32-4.53-4.92-3.19-8.01,1.32-3.11,4.9-4.57,8.01-3.19l68.62,29.53c5.11,2.19,8.33,7.22,8.2,12.79-.14,5.57-3.6,10.42-8.82,12.37l-74.45,27.71c-.7,.26-1.43,.38-2.13,.38Z"/>
                                        <g>
                                            <path class="d" d="M300.26,365.72l2.19-17.12,6.14-48.75,9.52-75.5c.61-4.64,.85-9.15,.85-13.67,0-53.83-40.16-100.82-95.08-107.66-59.44-7.57-113.76,34.67-121.33,94.11l-11.35,89.33,.24-1.67s-4.05,33.36-15.45,64.83"/>
                                            <path class="f" d="M306.32,366.49l-12.11-1.55,17.86-141.36c.55-4.17,.81-8.38,.81-12.91,0-51.55-38.57-95.23-89.73-101.61-55.95-7.13-107.37,32.71-114.53,88.83l-11.13,87.61h.02c-.17,1.39-4.27,34.42-15.77,66.18l-11.47-4.15c9.61-26.53,13.93-54.84,14.9-61.85h-.01l11.35-89.34c8-62.78,65.38-107.35,128.16-99.39,57.24,7.13,100.41,56.02,100.41,113.72,0,5.07-.3,9.8-.91,14.47l-17.86,141.35Z"/>
                                        </g>
                                        <path class="f" d="M242.5,213.75c5.25-14.28,26.25-13.49,30.96,.97,1.35,4.13,2.09,8.62,1.71,13.3-.42,5.21-2.17,10.04-4.52,14.3-7.93,14.4-29.75,10.25-31.17-6.13-.22-2.54-.25-5.3-.02-8.29,.4-5.34,1.52-10.05,3.03-14.16Z"/>
                                        <path class="f" d="M267.68,447.53c-1.48,0-2.96-.54-4.12-1.61-2.49-2.28-2.65-6.14-.37-8.62,26.21-28.54,31.78-78.22,31.84-78.72,.35-3.35,3.34-5.79,6.71-5.42,3.35,.36,5.78,3.36,5.42,6.71-.23,2.19-6.02,54.14-34.99,85.68-1.2,1.31-2.85,1.98-4.49,1.98Z"/>
                                        <path class="f" d="M225.76,197.26c-1.28,0-2.55-.39-3.64-1.2-2.71-2.01-3.27-5.82-1.28-8.51,.49-.66,12-15.97,30.21-18.62,10.79-1.56,21.37,1.54,31.58,9.2,2.69,2.03,3.23,5.85,1.2,8.55-2,2.68-5.83,3.27-8.55,1.2-10.41-7.83-20.9-9.21-31.17-4.08-8.24,4.12-13.41,10.94-13.46,11.01-1.2,1.6-3.04,2.44-4.9,2.44Z"/>
                                    </g>
                                </g>
                            </g>
                        </svg>
                    </div>
                    <div style="margin-left: 14px;">

                        <div style="font-weight: 700; font-size: 14px; line-height: 24px;">What is PostGuard?</div>

                        <div style="font-weight: 300; font-size: 12px; line-height: 20px;">
                                PostGuard is a service for secure emailing and file sharing. 
                                Only the intended recipient(s) can decrypt and read the emails or files sent with PostGuard. With PostGuard your emails and files are end-to-end encrypted. 
                                The "Encryption for all"-team of the Radboud University has developed PostGuard. 
                            <br/>
                            <a href="https://postguard.eu">More information about PostGuard</a>
                        </div>
                    </div>
                </div>

                <div style="text-align: left; margin-top: 25px; margin-left: 70px; width: 75%;">

                    <div style="height: 22px; width: 20px; float: left; clear: none;">

                        <svg height="22px" viewBox="0 0 170 170" version="1.1"
                            xmlns="http://www.w3.org/2000/svg"
                            xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve"
                            xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:1.41421;">
                            <g transform="matrix(1,0,0,1,-0.588574,-0.544313)">
                                <g id="Rounded_Rectangle_1_1_" transform="matrix(0.945114,-0.32674,0.32674,0.945114,-8.94903,58.0541)">
                                    <g transform="matrix(0.945114,0.32674,-0.32674,0.945114,23.6518,-9.46055)">
                                        <path d="M33.906,116.205C29.989,116.205 26.567,113.866 25.389,110.385L4.684,49.145C3.134,44.563 5.885,39.476 10.816,37.805L109.378,4.405C110.432,4.048 111.523,3.866 112.619,3.866C116.536,3.866 119.959,6.205 121.137,9.687L141.842,70.926C143.392,75.507 140.641,80.595 135.71,82.267L37.147,115.666C36.093,116.024 35.003,116.205 33.906,116.205L33.906,116.205Z" style="fill:#d44454;fill-rule:nonzero;" />
                                        <path d="M112.619,7.116C115.084,7.116 117.302,8.492 118.057,10.728L138.762,71.967C139.74,74.857 137.906,78.09 134.665,79.189L36.103,112.588C35.369,112.837 34.627,112.954 33.905,112.954C31.44,112.954 29.222,111.578 28.466,109.343L7.762,48.104C6.784,45.214 8.619,41.98 11.859,40.883L110.421,7.483C111.154,7.234 111.897,7.116 112.619,7.116M112.619,0.616C111.167,0.616 109.725,0.855 108.335,1.326L9.773,34.726C3.145,36.972 -0.519,43.907 1.605,50.186L22.31,111.424C23.935,116.227 28.595,119.453 33.907,119.453C35.359,119.453 36.801,119.215 38.192,118.743L136.753,85.344C143.381,83.097 147.045,76.161 144.921,69.883L124.214,8.646C122.59,3.843 117.93,0.616 112.619,0.616Z" style="fill:#d44454;fill-rule:nonzero;" />
                                    </g>
                                    <g transform="matrix(0.945114,0.32674,-0.32674,0.945114,38.5375,-37.9081)">
                                        <path d="M33.906,116.205C29.989,116.205 26.567,113.866 25.389,110.385L4.684,49.145C3.134,44.563 5.885,39.476 10.816,37.805L109.378,4.405C110.432,4.048 111.523,3.866 112.619,3.866C116.536,3.866 119.959,6.205 121.137,9.687L141.842,70.926C143.392,75.507 140.641,80.595 135.71,82.267L37.147,115.666C36.093,116.024 35.003,116.205 33.906,116.205L33.906,116.205Z" style="fill:#ffbb58;fill-rule:nonzero;" />
                                        <path d="M112.619,7.116C115.084,7.116 117.302,8.492 118.057,10.728L138.762,71.967C139.74,74.857 137.906,78.09 134.665,79.189L36.103,112.588C35.369,112.837 34.627,112.954 33.905,112.954C31.44,112.954 29.222,111.578 28.466,109.343L7.762,48.104C6.784,45.214 8.619,41.98 11.859,40.883L110.421,7.483C111.154,7.234 111.897,7.116 112.619,7.116M112.619,0.616C111.167,0.616 109.725,0.855 108.335,1.326L9.773,34.726C3.145,36.972 -0.519,43.907 1.605,50.186L22.31,111.424C23.935,116.227 28.595,119.453 33.907,119.453C35.359,119.453 36.801,119.215 38.192,118.743L136.753,85.344C143.381,83.097 147.045,76.161 144.921,69.883L124.214,8.646C122.59,3.843 117.93,0.616 112.619,0.616Z" style="fill:#ffbb58;fill-rule:nonzero;" />
                                    </g>
                                    <g transform="matrix(0.872113,0.489304,-0.489304,0.872113,33.7109,-39.4445)">
                                        <path d="M33.906,116.205C29.989,116.205 26.567,113.866 25.389,110.385L4.684,49.145C3.134,44.563 5.885,39.476 10.816,37.805L109.378,4.405C110.432,4.048 111.523,3.866 112.619,3.866C116.536,3.866 119.959,6.205 121.137,9.687L141.842,70.926C143.392,75.507 140.641,80.595 135.71,82.267L37.147,115.666C36.093,116.024 35.003,116.205 33.906,116.205L33.906,116.205Z" style="fill:#2bc194;fill-rule:nonzero;" />
                                        <path d="M112.619,7.116C115.084,7.116 117.302,8.492 118.057,10.728L138.762,71.967C139.74,74.857 137.906,78.09 134.665,79.189L36.103,112.588C35.369,112.837 34.627,112.954 33.905,112.954C31.44,112.954 29.222,111.578 28.466,109.343L7.762,48.104C6.784,45.214 8.619,41.98 11.859,40.883L110.421,7.483C111.154,7.234 111.897,7.116 112.619,7.116M112.619,0.616C111.167,0.616 109.725,0.855 108.335,1.326L9.773,34.726C3.145,36.972 -0.519,43.907 1.605,50.186L22.31,111.424C23.935,116.227 28.595,119.453 33.907,119.453C35.359,119.453 36.801,119.215 38.192,118.743L136.753,85.344C143.381,83.097 147.045,76.161 144.921,69.883L124.214,8.646C122.59,3.843 117.93,0.616 112.619,0.616Z" style="fill:#2bc194;fill-rule:nonzero;" />
                                    </g>
                                    <g transform="matrix(0.876971,0.480544,-0.480544,0.876971,56.23,-21.0767)">
                                        <path d="M33.906,116.205C29.989,116.205 26.567,113.866 25.389,110.385L4.684,49.145C3.134,44.563 5.885,39.476 10.816,37.805L109.378,4.405C110.432,4.048 111.523,3.866 112.619,3.866C116.536,3.866 119.959,6.205 121.137,9.687L141.842,70.926C143.392,75.507 140.641,80.595 135.71,82.267L37.147,115.666C36.093,116.024 35.003,116.205 33.906,116.205L33.906,116.205Z" style="fill:#00b1e6;fill-rule:nonzero;" />
                                        <path d="M112.619,7.116C115.084,7.116 117.302,8.492 118.057,10.728L138.762,71.967C139.74,74.857 137.906,78.09 134.665,79.189L36.103,112.588C35.369,112.837 34.627,112.954 33.905,112.954C31.44,112.954 29.222,111.578 28.466,109.343L7.762,48.104C6.784,45.214 8.619,41.98 11.859,40.883L110.421,7.483C111.154,7.234 111.897,7.116 112.619,7.116M112.619,0.616C111.167,0.616 109.725,0.855 108.335,1.326L9.773,34.726C3.145,36.972 -0.519,43.907 1.605,50.186L22.31,111.424C23.935,116.227 28.595,119.453 33.907,119.453C35.359,119.453 36.801,119.215 38.192,118.743L136.753,85.344C143.381,83.097 147.045,76.161 144.921,69.883L124.214,8.646C122.59,3.843 117.93,0.616 112.619,0.616Z" style="fill:#00b1e6;fill-rule:nonzero;" />
                                    </g>
                                </g>
                                <g id="Rounded_Rectangle_1_1_1" serif:id="Rounded_Rectangle_1_1_" transform="matrix(1,0,0,1,12.3739,26.4544)">
                                    <g>
                                        <path d="M33.906,116.205C29.989,116.205 26.567,113.866 25.389,110.385L4.684,49.145C3.134,44.563 5.885,39.476 10.816,37.805L109.378,4.405C110.432,4.048 111.523,3.866 112.619,3.866C116.536,3.866 119.959,6.205 121.137,9.687L141.842,70.926C143.392,75.507 140.641,80.595 135.71,82.267L37.147,115.666C36.093,116.024 35.003,116.205 33.906,116.205L33.906,116.205Z" style="fill:#004c92;fill-rule:nonzero;" />
                                        <path d="M112.619,7.116C115.084,7.116 117.302,8.492 118.057,10.728L138.762,71.967C139.74,74.857 137.906,78.09 134.665,79.189L36.103,112.588C35.369,112.837 34.627,112.954 33.905,112.954C31.44,112.954 29.222,111.578 28.466,109.343L7.762,48.104C6.784,45.214 8.619,41.98 11.859,40.883L110.421,7.483C111.154,7.234 111.897,7.116 112.619,7.116M112.619,0.616C111.167,0.616 109.725,0.855 108.335,1.326L9.773,34.726C3.145,36.972 -0.519,43.907 1.605,50.186L22.31,111.424C23.935,116.227 28.595,119.453 33.907,119.453C35.359,119.453 36.801,119.215 38.192,118.743L136.753,85.344C143.381,83.097 147.045,76.161 144.921,69.883L124.214,8.646C122.59,3.843 117.93,0.616 112.619,0.616Z" style="fill:#fff;fill-rule:nonzero;" />
                                    </g>
                                </g>
                                <g id="IRMA_1_" transform="matrix(1,0,0,1,12.3739,26.4544)">
                                    <clipPath id="_clip1">
                                        <path d="M139.203,72.585L128.166,39.679L135.507,39.343L146.64,71.321L146.64,0L0,0L0,120.72L146.64,120.72L146.64,73.073L139.203,72.585Z" />
                                    </clipPath>
                                    <g clip-path="url(#_clip1)">
                                        <rect x="42.199" y="40.296" width="6.083" height="32.149" style="fill:#fff;fill-rule:nonzero;" />
                                        <path d="M55.331,40.296L66.484,40.296C69.767,40.296 72.438,41.26 74.498,43.19C76.559,45.119 77.59,47.507 77.59,50.355C77.59,52.376 77.026,54.19 75.899,55.797C74.774,57.404 73.245,58.606 71.314,59.402L78.796,72.445L72.086,72.445L65.568,60.32L61.415,60.32L61.415,72.445L55.332,72.445L55.332,40.296L55.331,40.296ZM66.484,45.624L61.415,45.624L61.415,54.993L66.484,54.993C67.932,54.993 69.091,54.564 69.96,53.707C70.829,52.85 71.264,51.717 71.264,50.309C71.264,48.931 70.829,47.806 69.96,46.933C69.091,46.06 67.932,45.624 66.484,45.624Z" style="fill:#fff;fill-rule:nonzero;" />
                                        <path d="M101.017,63.91L96.001,63.893L89.512,52.478L89.512,72.444L83.429,72.444L83.429,40.296L88.836,40.296L98.491,57.426L108.196,40.296L113.555,40.296L113.555,72.445L107.472,72.445L107.472,52.513L101.017,63.91Z" style="fill:#fff;fill-rule:nonzero;" />
                                        <path d="M139.772,72.445L137.608,65.602L126.101,65.602L123.936,72.445L117.322,72.445L128.764,40.296L134.897,40.296L146.338,72.445L139.772,72.445ZM131.854,47.506L127.596,60.871L136.112,60.871L131.854,47.506Z" style="fill:#fff;fill-rule:nonzero;" />
                                    </g>
                                </g>
                            </g>
                        </svg>

                    </div>

                    <div style="margin-left: 34px;">
                        <div style="font-weight: 700; font-size: 14px; line-height: 24px;">What is the IRMA app?</div>
                        <div style="font-weight: 300; font-size: 12px; line-height: 20px;">
                            The IRMA app is a general-purpose privacy-friendly authentication app. You need the IRMA app with PostGuard to prove that you really are the intended recipient.<br/>
                        <a href="https://irma.app">More information about IRMA</a>
                    </div>
                </div>
            </div>

        <div style="font-weight: 300; font-size: 14px; line-height: 20px; text-align: left; margin: 20px 0 0px 104px">

            <div style="font-style: normal; font-weight: 700; font-size: 14px; line-height: 24px;">
                        Download the free IRMA app:
            </div>

            <a href="https://apps.apple.com/us/app/irma-authentication/id1294092994" title="IRMA for iOS">App store</a>
		            &nbsp;
		            &nbsp;
		            &nbsp;
            <a href="https://play.google.com/store/apps/details?id=org.irmacard.cardemu&gl=US" title="IRMA for Android">Google Play</a>
        </div>


    </div>

</div>

</body>

</html>\r\n\r\n`
        content += `--${this.boundaryRelated}\r\n`
        content += 'Content-Type: image/png; name="postguard.png"\r\n'
        content += 'Content-Transfer-Encoding: base64"\r\n'
        content += 'Content-ID: <pglogo>\r\n'
        content += 'Content-Disposition: inline; filename="postguard.png"\r\n\r\n'
        content += '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'
        content += `--${this.boundaryRelated}--\r\n\r\n`

        content += `--${this.boundaryAlt}\r\n\r\n`
        content += `--${this.boundary}\r\n`
        content += 'Content-Type: application/postguard; name="postguard.encrypted"\r\n'
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
            ...(this.recipients.length > 0 && { To: `${this.recipients.toString()}` }),
            ...(this.ccRecipients.length > 0 && { Cc: `${this.ccRecipients.toString()}` }),
            ...(this.bccRecipients.length > 0 && { Bcc: `${this.bccRecipients.toString()}` }),
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
        )}\r\n${this.getMimeBody()}--${this.boundary
            }--`
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

        for (let i = 0; i < 30; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length))

        return text
    }
}
