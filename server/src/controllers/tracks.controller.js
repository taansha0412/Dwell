import * as music from '../services/musicApi.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const chart = asyncHandler(async (_req, res) => res.json(await music.getChart()));
export const getTrack = asyncHandler(async (req, res) => res.json(await music.getTrack(req.params.id)));
export const getAlbum = asyncHandler(async (req, res) => res.json(await music.getAlbum(req.params.id)));
export const getArtist = asyncHandler(async (req, res) => res.json(await music.getArtist(req.params.id)));
