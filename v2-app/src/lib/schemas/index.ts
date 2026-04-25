import { z } from "zod";

// --- Base Types ---
const TimestampSchema = z.any(); // Depending on client/admin sdk this can be different, so loosely typed for now

// --- Products Schema ---
export const ProductSchema = z.object({
  id: z.string().optional(),
  slug: z.string().optional(),
  nameTR: z.string().min(1, "Turkish name is required"),
  nameEN: z.string().min(1, "English name is required"),
  descriptionTR: z.string().optional(),
  descriptionEN: z.string().optional(),
  currency: z.enum(['₺', '$', '€']).default('₺'),
  priceMonthly: z.number().optional(),
  originalPriceMonthly: z.number().optional(), // For strike-through discounts
  priceYearly: z.number().optional(),
  originalPriceYearly: z.number().optional(), // For strike-through discounts
  priceLifetime: z.number().optional(),
  originalPriceLifetime: z.number().optional(), // For strike-through discounts
  discountEndDate: z.string().optional(), // Discount expiration date
  type: z.enum(["product", "service"]).default("product"),
  imageUrl: z.string().optional(),
  active: z.boolean().default(true),
  createdAt: TimestampSchema.optional(),
  updatedAt: TimestampSchema.optional(),
});

export type Product = z.infer<typeof ProductSchema>;

// --- Blog Posts Schema ---
export const BlogPostSchema = z.object({
  id: z.string().optional(),
  slug: z.string().optional(),
  imageUrl: z.string().optional(),
  order: z.number().default(1),
  active: z.boolean().default(true),
  catTR: z.string().optional(),
  catEN: z.string().optional(),
  date: z.string().optional(),
  titleTR: z.string().optional(),
  titleEN: z.string().optional(),
  excerptTR: z.string().optional(),
  excerptEN: z.string().optional(),
  contentTR: z.string().optional(),
  contentEN: z.string().optional(),
  tagsTR: z.array(z.string()).default([]),
  tagsEN: z.array(z.string()).default([]),
  author: z.string().optional(),
  readTime: z.string().optional(),
  createdAt: TimestampSchema.optional(),
  updatedAt: TimestampSchema.optional(),
});

export type BlogPost = z.infer<typeof BlogPostSchema>;

// --- Contact Submissions Schema ---
export const ContactSubmissionSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  email: z.string().email(),
  service: z.string().optional(),
  message: z.string().optional(),
  read: z.boolean().default(false),
  timestamp: TimestampSchema.optional(),
});

export type ContactSubmission = z.infer<typeof ContactSubmissionSchema>;

// --- Web Users Schema ---
export const WebUserSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  displayName: z.string().optional(),
  photoURL: z.string().optional(),
  joinDate: TimestampSchema.optional(),
  roles: z.array(z.string()).default(["member"]),
  lang: z.string().default("tr"),
});

export type WebUser = z.infer<typeof WebUserSchema>;

// --- Gallery Items Schema ---
export const GalleryItemSchema = z.object({
  id: z.string().optional(),
  slug: z.string().optional(),
  section: z.string().default('work'),
  order: z.number().default(1),
  imageUrl: z.string().optional(),
  titleTR: z.string().optional(),
  titleEN: z.string().optional(),
  descTR: z.string().optional(),
  descEN: z.string().optional(),
  fullContentTR: z.string().optional(),
  fullContentEN: z.string().optional(),
  updatedAt: TimestampSchema.optional(),
});

export type GalleryItem = z.infer<typeof GalleryItemSchema>;

// --- Site Content Schema ---
export const SiteContentSchema = z.object({
  id: z.string(), // e.g., 'hero', 'footer', 'about'
  section: z.string().optional(),
  contentTR: z.string().optional(),
  contentEN: z.string().optional(),
  updatedAt: TimestampSchema.optional(),
});

export type SiteContent = z.infer<typeof SiteContentSchema>;

// --- Site Settings Schema ---
export const SiteSettingsSchema = z.object({
  id: z.literal('global'),
  maintenanceMode: z.boolean().default(false),
  contactEmail: z.string().email().or(z.literal('')).optional(),
  contactPhone: z.string().optional(),
  socialInstagram: z.string().optional(),
  socialLinkedin: z.string().optional(),
  socialTwitter: z.string().optional(),
  updatedAt: TimestampSchema.optional(),
});

export type SiteSettings = z.infer<typeof SiteSettingsSchema>;
