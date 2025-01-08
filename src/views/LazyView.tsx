import { Text } from '@mantine/core';

export default function LazyView() {
	return (
		<Text>you should see a loading animation (if your CPU is slow) or a network request for this component only once</Text>
	);
}
