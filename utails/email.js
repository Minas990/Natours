const nodemailer = require('nodemailer');
const pug = require('pug');

const htmlToText = require('html-to-text');

//new Email(user,url).sendWelcome();//passwordReset,.....etc

module.exports = class Email 
{
    constructor(user,url) 
    {
        this.to = user.email;
        this.first = user.name.split(' ')[0];
        this.url = url;
        this.from = `mina bakheet <${process.env.EMAIL_FROM}>`;
    }

    newTransport() 
    {
        if(process.env.NODE_ENV === 'production')
        {
            
            return nodemailer.createTransport({
                service:'Gmail',
                auth: {
                    user:process.env.EMAIL_SERVICE_USERNAME,
                    pass:process.env.EMAIL_SERVICE_PASSWORD,
                }
            });
        }
        return nodemailer.createTransport
        (
            {
                host: process.env.EMAIL_HOST,
                port: process.env.EMAIL_PORT,
                auth: {
                    user: process.env.EMAIL_USERNAME,
                    pass: process.env.EMAIL_PASSWORD
                },
            }
        );
    }

    //send the actual emails
    async send(template,subject) 
    {
        //render html based on pug template
        const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`,{
            firstName: this.first,
            url: this.url,
            subject
        });
        //email options
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject: subject,
            html,
            text: htmlToText.htmlToText(html)
        }
        //make transporter.then send email
        await this.newTransport().sendMail(mailOptions);
    }

    async sendWelcome()
    {
        await this.send(`Welcome`,'Welcome to the natours family!');
    }

    async sendPasswordReset() 
    {
        await this.send('passwordReset','Your password reset (valid for only 10m)');
    }

}






//this for gmail
/*
// const transporter = nodemailer.createTransport({
//     service: 'Gmail',
//     auth: {
//         user: process.env.EMAIL_USERNAME,
//         pass: process.env.EMAIL_PASSWORD
//     }
//     //activate in gmail 'less secure app'
// })
*/