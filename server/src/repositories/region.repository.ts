import Region from "../models/Region";

export const createRegion = async (data: {
  name: string;
  prefix: string;
  parentRegion: string | null;
}) => Region.create(data);

export const findRegionById = async (regionId: string) => Region.findById(regionId);

export const findRegionByIdPopulated = async (regionId: string) =>
  Region.findById(regionId).populate("deputy");

export const findRegionByPrefix = async (prefix: string) => Region.findOne({ prefix });

export const updateRegionById = async (regionId: string, update: Record<string, unknown>) =>
  Region.findByIdAndUpdate(regionId, update, {
    returnDocument: "after",
    runValidators: true,
  });

export const deleteRegionById = async (regionId: string) => Region.findByIdAndDelete(regionId);

export const regionHasChildren = async (regionId: string) =>
  Region.exists({ parentRegion: regionId });

//this was updated
export const findAllRegionsPopulated = async () =>
  Region.find()
    .populate({
      path: "deputy",
      populate: { path: "currentHolder", select: "firstName lastName numericId role grade" },
    })
    .sort({ createdAt: 1 });

export const findSubregionsByParentId = async (parentRegionId: string) =>
  Region.find({ parentRegion: parentRegionId });
