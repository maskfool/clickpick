import express from "express";
import { createUploadthing } from "uploadthing/server";
import { createRouteHandler } from "uploadthing/express";
import { UploadThingError } from "uploadthing/server";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Create UploadThing instance
const f = createUploadthing();

// Auth function for UploadThing - temporarily disabled for debugging
const auth = async (req) => {
  // Temporarily allow all uploads for debugging
  console.log("UploadThing auth: Allowing upload for debugging");
  return { id: "debug-user" };
};

// FileRouter configuration
export const ourFileRouter = {
  // Single reference image uploader
  referenceImageUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
      minFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      // This code runs on your server before upload
      const user = auth(req);
      
      // If you throw, the user will not be able to upload
      if (!user.id || user.id === "anonymous") {
        throw new UploadThingError("Unauthorized");
      }
      
      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("✅ Reference image uploaded:", file.url);
      console.log("Uploaded by userId:", metadata.userId);
      
      // Return data that will be sent to the client
      return { 
        uploadedBy: metadata.userId,
        imageUrl: file.url,
        key: file.key,
        relativePath: file.key
      };
    }),

  // Multiple reference images uploader
  multipleReferenceImagesUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 5,
      minFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      // This code runs on your server before upload
      const user = auth(req);
      
      // If you throw, the user will not be able to upload
      if (!user.id || user.id === "anonymous") {
        throw new UploadThingError("Unauthorized");
      }
      
      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("✅ Multiple images uploaded:", file.url);
      console.log("Uploaded by userId:", metadata.userId);
      
      // Return data that will be sent to the client
      return { 
        uploadedBy: metadata.userId,
        imageUrl: file.url,
        key: file.key,
        relativePath: file.key
      };
    }),

  // User photo uploader
  userPhotoUploader: f({
    image: {
      maxFileSize: "2MB",
      maxFileCount: 1,
      minFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      const user = auth(req);
      
      if (!user.id || user.id === "anonymous") {
        throw new UploadThingError("Unauthorized");
      }
      
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("✅ User photo uploaded:", file.url);
      console.log("Uploaded by userId:", metadata.userId);
      
      return { 
        uploadedBy: metadata.userId,
        imageUrl: file.url,
        key: file.key,
        relativePath: file.key
      };
    }),

  // Generated thumbnail uploader
  generatedThumbnailUploader: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 3,
      minFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      const user = auth(req);
      
      if (!user.id || user.id === "anonymous") {
        throw new UploadThingError("Unauthorized");
      }
      
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("✅ Generated thumbnail uploaded:", file.url);
      console.log("Uploaded by userId:", metadata.userId);
      
      return { 
        uploadedBy: metadata.userId,
        imageUrl: file.url,
        key: file.key,
        relativePath: file.key
      };
    }),
};

// Create UploadThing route handlers
const uploadThingRouter = createRouteHandler({
  router: ourFileRouter,
  config: {
    callbackUrl: process.env.UPLOADTHING_CALLBACK_URL || `http://localhost:${process.env.PORT}/api/uploadthing`,
  },
});

// Apply the UploadThing route handlers
router.use(uploadThingRouter);

// Add manual route handlers for debugging
router.post('/test-upload', (req, res) => {
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Body:', req.body);
  res.json({ message: 'Test upload endpoint', contentType: req.headers['content-type'] });
});

// Add a fallback route for debugging
router.get('/debug', (req, res) => {
  res.json({ 
    message: 'UploadThing debug endpoint',
    routes: Object.keys(ourFileRouter),
    timestamp: new Date().toISOString()
  });
});

export default router;
