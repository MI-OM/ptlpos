declare module 'nodemailer' {
  interface TransportOptions {
    host?: string;
    port?: number;
    secure?: boolean;
    auth?: {
      user: string;
      pass: string;
    };
  }

  interface SendMailOptions {
    from: string;
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
    replyTo?: string;
  }

  interface SendMailResponse {
    messageId: string;
  }

  interface Transporter {
    sendMail(
      mailOptions: SendMailOptions,
    ): Promise<SendMailResponse>;
  }

  function createTransport(options: TransportOptions): Transporter;

  export { Transporter, createTransport };
}
