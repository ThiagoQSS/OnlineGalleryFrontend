"use client";

import React from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Download from "yet-another-react-lightbox/plugins/download";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import Captions from "yet-another-react-lightbox/plugins/captions";
import "yet-another-react-lightbox/plugins/captions.css";
import { ArquivoResponseDTO } from "@/types/api";

interface PhotoLightboxProps {
	photos: ArquivoResponseDTO[];
	index: number | null;
	onClose: () => void;
}

export default function PhotoLightbox({ photos, index, onClose }: PhotoLightboxProps) {
	if (index === null || index < 0 || index >= photos.length) {
		return null;
	}

	const slides = photos.map((photo) => ({
		src: photo.url,
		title: photo.nome,
		description: photo.dataCriacao
			? new Intl.DateTimeFormat("pt-BR", {
					dateStyle: "medium",
					timeStyle: "short",
				}).format(new Date(photo.dataCriacao))
			: undefined,
		download: {
			url: photo.url,
			filename: photo.nome,
		},
	}));

	return (
		<Lightbox
			open={index !== null}
			close={onClose}
			index={index}
			slides={slides}
			plugins={[Zoom, Download, Fullscreen, Thumbnails, Captions]}
			animation={{ fade: 250 }}
			carousel={{ finite: false }}
		/>
	);
}
