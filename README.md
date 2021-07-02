# IRMAseal mail utils
This library is meant to run in the browser to offer the following functionality:

- Parsing an IRMAseal encrypted email to make it easier for clients to decrypt the mail.
- Composing a IRMAseal encrypted mail to make it easier for clients to send a mail encrypted by IRMASeal.

Build the library via `npm run build`

## Examples

- For an example on how to compose and parse a mail, see [examples/composeAndReadMail.ts](test/composeAndReadMail.ts)
- For an example on how an Exchange mail is parsed, see [examples/readIrmaSealMail.ts](test/readExchangeMail.ts)

Run the examples by executing `npm run test`

## Prerequisites

Typescript needs to be installed to build the project.

Node needs to be installed to run the tests / examples.
