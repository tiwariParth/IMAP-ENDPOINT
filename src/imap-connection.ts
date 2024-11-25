import Imap, { ImapMessage, ImapMessageAttributes, Box } from "node-imap";
import { simpleParser, ParsedMail } from "mailparser";
import dotenv from "dotenv";
import { Readable } from "stream";

dotenv.config();

type imapConfig = {
  user: string;
  password: string;
  host: string;
  port: number;
  tls: boolean;
};

const imap: Imap = new Imap({
  user: process.env.EMAIL_USER || "",
  password: process.env.EMAIL_PASS || "",
  host: process.env.EMAIL_HOST || "",
  port: parseInt(process.env.EMAIL_PORT || "993", 10),
  tls: true,
});

imap.once("ready", () => {
  console.log("IMAP Connection Ready");
  imap.openBox("INBOX", true, (err: Error | null, box: Box) => {
    if (err) throw err;
    console.log(`Total Messages in INBOX: ${box.messages.total}`);
  });
});

imap.once("error", (err) => {
  console.error("IMAP Connection Error:", err);
});

imap.connect();

imap.once("ready", () => {
  imap.openBox("INBOX", true, (err, box) => {
    if (err) throw err;

    imap.search(["ALL"], (err, results) => {
      if (err) throw err;

      const fetch = imap.fetch(results, { bodies: "" });
      fetch.on("message", (msg, seqno) => {
        msg.on("body", (stream, info) => {
          simpleParser(stream as Readable, (err, parsed: ParsedMail) => {
            if (err) throw err;
            console.log(`Email Subject: ${parsed.subject}`);
          });
        });
      });

      fetch.once("error", (err) => {
        console.error("Fetch Error:", err);
      });
    });
  });
});