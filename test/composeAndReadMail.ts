import {ComposeMail, ReadMail} from "./../dist/index";

console.log("\n\n====== composeMail.ts examples ======")

const CT: string = "ABCDEF"
const ATTACHMENT: string = "ATTACHMENTCONTENT"
const FILENAME: string = "ATTACHMENT.TXT"
const VERSION: string = "Version 1"
const enc = new TextEncoder()
const dec = new TextDecoder()

const composeMail = new ComposeMail()

composeMail.setSender("daniel.ostkamp@ru.nl")
composeMail.addRecipient("irmasealtest@gmail.com")
composeMail.setCiphertext(enc.encode(CT))
composeMail.setSubject("Test")
composeMail.setVersion("1")
composeMail.addAttachment(enc.encode(ATTACHMENT), FILENAME)

console.log("Composed mime mail: \n", composeMail.getMimeMail())

const readMail = new ReadMail()

readMail.parseMail(composeMail.getMimeMail())

console.log("Readmail version: ", readMail.getVersion())

const ctBytes = dec.decode(readMail.getCiphertext())
console.log("Readmail ct: ", ctBytes)

const attachment = readMail.getAttachments()[0]
const attachmentBytes = dec.decode(attachment.body)
console.log("Readmail attachment: ", attachmentBytes, ", filename: " + attachment.fileName)

console.assert(CT.localeCompare(ctBytes)===0)
console.assert(VERSION.localeCompare(readMail.getVersion())===0)
console.assert(ATTACHMENT.localeCompare(attachmentBytes)===0)
console.assert(FILENAME.localeCompare(attachment.fileName)===0)
