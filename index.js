var aws = require('aws-sdk');
var nodemailer = require('nodemailer');

var ses = new aws.SES({
   region: 'us-west-2'
});
var s3 = new aws.S3();
const correo_respuesta = process.env.CORREO_RESPUESTA;
const correo_emisor = process.env.CORREO_EMISOR;

function getS3File(bucket, key) {
    return new Promise(function (resolve, reject) {
        s3.getObject(
            {
                Bucket: bucket,
                Key: key
            },
            function (err, data) {
                if (err) return reject(err);
                else return resolve(data);
            }
        );
    })
}


exports.handler = function(event, context, callback) {
    var key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    getS3File(event.Records[0].s3.bucket.name, key)
    .then(function (fileData) {
        var mailOptions = {
            from: correo_emisor,
            subject: 'Este mail fue enviado!',
            html: `<p>Tienes un mensaje de <b>${correo_emisor}</b></p>`,
            to: correo_respuesta,
            // bcc: Any BCC address you want here in an array,
            attachments: [
                {
                    filename: key,
                    content: fileData.Body
                }
            ]
        };

        console.log('Creating SES transporter');
        // create Nodemailer SES transporter
        var transporter = nodemailer.createTransport({
            SES: ses
        });

        // send email
        transporter.sendMail(mailOptions, function (err, info) {
            if (err) {
                console.log(err);
                console.log('Error sending email');
                callback(err);
            } else {
                console.log('Email sent successfully');
                callback();
            }
        });
    })
    .catch(function (error) {
        console.log(error);
        console.log('Error getting attachment from S3');
        callback(err);
    });

};