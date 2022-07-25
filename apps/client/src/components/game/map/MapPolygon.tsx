import {FeatureGroup} from 'react-leaflet';
import {EditControl} from 'react-leaflet-draw';
import {DrawEvents, LatLng} from 'leaflet';
import {Dispatch, SetStateAction} from 'react';
import {GameOptions} from '@monorepo/shared/src/index';
import {useMe} from '../../../utils/hooks';

type UpdateParameter =
	| DrawEvents.Edited
	| DrawEvents.Created
	| DrawEvents.Deleted;

export default (props: {
	options: GameOptions;
	setOptions: Dispatch<SetStateAction<GameOptions>>;
}) => {
	const setVertices = (vertices: GameOptions['vertices']) => {
		props.setOptions({
			...props.options,
			vertices,
		});
	};

	const update = (v: UpdateParameter) => {
		switch (v.type) {
			case 'draw:deleted':
				setVertices([]);
				break;
			case 'draw:created':
				setVertices(
					(v.layer.editing.latlngs[0][0] as LatLng[]).map(({lat, lng}) => ({
						lat,
						lng,
					}))
				);
				break;
			case 'draw:edited':
				const latlngArr = (
					((v as DrawEvents.Edited).layers.getLayers()[0] as any)!.editing
						.latlngs[0][0] as LatLng[]
				).map(({lat, lng}) => ({lat, lng}));
				setVertices(latlngArr);
		}
	};

	return (
		<FeatureGroup>
			<EditControl
				position="topright"
				onEdited={update}
				onCreated={update}
				onDeleted={update}
				draw={{
					rectangle: false,
					circle: false,
					marker: false,
					polyline: false,
					circlemarker: false,
				}}
			/>
			{props.options.vertices.length && (
				<link rel="stylesheet" type="text/css" href={'control-hide.css'} />
			)}
		</FeatureGroup>
	);
};
