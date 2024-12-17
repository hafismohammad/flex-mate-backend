import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { URL } from 'url';
import { Upload } from '@aws-sdk/lib-storage';

dotenv.config();

const bucketName = process.env.BUCKET_NAME as string;
const bucketRegion = process.env.BUCKET_REGION as string;
const accessKey = process.env.ACCESS_KEY as string;
const secretAccessKey = process.env.SECRET_ACCESS_KEY as string;

// Initialize S3 client
const s3 = new S3Client({
    credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretAccessKey,
    },
    region: bucketRegion,
});

// Function to generate random file name
const randomName = (file: string): string => {
    const randomNumber = Math.floor(Math.random() * 10000000);
    return `${randomNumber}_${file}`;
};
import fs from 'fs';
import path from 'path';
const addFileToS3 = async (file: Express.Multer.File): Promise<string> => {
    try {
        const filePath = path.join(__dirname, '../../public/uploads', file.filename);

        // Read the file from disk
        const fileContent = fs.readFileSync(filePath);

        const fileName = `${Date.now()}_${file.originalname}`;

        const upload = new Upload({
            client: s3,
            params: {
                Bucket: bucketName,
                Key: fileName,
                Body: fileContent,  // Use fileContent instead of file.buffer
                ContentType: file.mimetype,
            },
        });

        await upload.done();
        return fileName;
    } catch (error) {
        console.error('Error uploading file to S3:', error);
        throw new Error('Failed to upload file to S3');
    }
};

// Retrieve file from S3
// const getFileFromS3 = async (key: string) => {
//     const command = new GetObjectCommand({
//         Bucket: bucketName,
//         Key: key,
//     });

//     const response = await s3.send(command);
//     return response.Body;
// };
const getFileFromS3 = async (fileName: string): Promise<string> => {
  try {
    // console.log('fileName-----------------',fileName);
    
      const options = {
          Bucket: bucketName,
          Key: fileName, // Ensure this is just the filename
      };
      const getCommand = new GetObjectCommand(options);
      const url = await getSignedUrl(s3, getCommand, { expiresIn: 60 * 60 }); 
      return url;
  } catch (error) {
      console.error("Error generating signed URL:", error);
      throw new Error("Could not retrieve file from S3");
  }
};


// Function to extract the key from the S3 URL
const extractKeyFromS3Url = (s3Url: string): string => {
    const url = new URL(s3Url);
    return url.pathname.split('/').pop() || '' // Extracts the key from the path
};


// Remove file from S3
const removeFileFromS3 = async (key: string) => {
    const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
    });

    await s3.send(command);
};

export { s3, bucketName, bucketRegion,extractKeyFromS3Url, randomName, addFileToS3, getFileFromS3, removeFileFromS3 };
