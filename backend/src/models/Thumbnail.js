import mongoose from "mongoose";

const thumbnailSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 500 },
    category: {
      type: String,
      required: true,
      enum: [
        "education","gaming","technology","entertainment","lifestyle",
        "business","news","sports","music","comedy","travel",
        "food","fitness","beauty","fashion","other",
      ],
    },
    originalPrompt: { type: String, required: true, trim: true },
    enhancedPrompt: { type: String, trim: true },
    finalPrompt: { type: String, required: true, trim: true },
    imageUrl: { type: String, required: true },

    // ✅ store uploaded ref image
    referenceImage: { type: String },

    variants: [{ url: String, mimeType: String, ext: String }],
    metadata: {
      width: { type: Number, default: 1280 },
      height: { type: Number, default: 720 },
      format: { type: String, default: "png" },
      size: { type: Number },
      aiModel: { type: String, default: "gemini-2.5-flash-image-preview" },
    },

    // ✅ each edit can also store referenceImage
    edits: [
      {
        userPrompt: { type: String, required: true },
        aiPrompt: { type: String, required: true },
        imageUrl: { type: String, required: true },
        referenceImage: { type: String },
        cost: { type: Number, default: 0 },
        timestamp: { type: Date, default: Date.now },
      },
    ],

    status: {
      type: String,
      enum: ["generating", "completed", "failed", "editing"],
      default: "generating",
    },
    isPublic: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    generationTime: { type: Number },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

thumbnailSchema.methods.addEdit = function (userPrompt, aiPrompt, imageUrl, referenceImage) {
  this.edits.push({ userPrompt, aiPrompt, imageUrl, referenceImage });
  this.status = "completed";
  return this.save();
};

thumbnailSchema.methods.incrementViews = function () {
  this.views += 1;
  return this.save();
};

thumbnailSchema.methods.incrementLikes = function () {
  this.likes += 1;
  return this.save();
};

const Thumbnail = mongoose.model("Thumbnail", thumbnailSchema);
export default Thumbnail;