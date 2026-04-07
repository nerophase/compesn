import { useCallback, useLayoutEffect, useState } from "react";

export const useDraftLayout = () => {
	const [championBoxHeight, setChampionBoxHeight] = useState<number>(0);
	const [championBoxWidth, setChampionBoxWidth] = useState<number>(0);
	const [totalHeight, setTotalHeight] = useState<number>(0);
	const [topLayerHeight, setTopLayerHeight] = useState<number>(0);
	const [bottomLayerHeight, setBottomLayerHeight] = useState<number>(0);
	const [teamStatusBoxWidth, setTeamStatusBoxWidth] = useState<number>(0);
	const [showUi, setShowUi] = useState<boolean>(false);

	const updateLayout = useCallback(() => {
		const championBoxWidth = Math.max(Math.min((window.innerWidth - 236) / 10, 140), 115); // -200px (middle box) -32px (4px gap between champion boxes) -4px (external side padding)
		const championBoxHeight = championBoxWidth * 1.818;
		const bottomLayerHeight = championBoxHeight + 88; // 64px (team name row) + 20px (row divider with team color) + 4px (padding top)
		const topLayerHeight = window.innerHeight - bottomLayerHeight - 64; // - 64px (navbar height)
		setTotalHeight(topLayerHeight + bottomLayerHeight);
		setChampionBoxWidth(championBoxWidth);
		setChampionBoxHeight(championBoxHeight);
		setBottomLayerHeight(bottomLayerHeight);
		setTopLayerHeight(topLayerHeight);
		setTeamStatusBoxWidth(championBoxWidth * 5 + 16);
	}, []);

	useLayoutEffect(() => {
		updateLayout();
		window.addEventListener("resize", updateLayout);
		setShowUi(true);
		return () => window.removeEventListener("resize", updateLayout);
	}, [updateLayout]);

	return {
		showUi,
		championBoxWidth,
		championBoxHeight,
		totalHeight,
		topLayerHeight,
		bottomLayerHeight,
		teamStatusBoxWidth,
	};
};
