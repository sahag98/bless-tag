import { Button, FlatList, StyleSheet, Text, TextInput, Dimensions, View } from 'react-native';
import React, { useEffect } from 'react';
import { Container } from '~/components/Container';
import db from '~/db';
import { id } from '@instantdb/react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { Canvas, Group, Path, Skia } from '@shopify/react-native-skia';
const { width } = Dimensions.get('window');

const TestScreen = () => {
  const [message, setMessage] = React.useState('');

  const { data } = db.useQuery({
    messages: {},
  });

  const messages = React.useMemo(() => data?.messages || [], [data?.messages]);

  const leafCount = Math.min(messages.length, 15);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 700 });
    scale.value = withSpring(1, { damping: 8 });
  }, [message.length]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  // Create a proper tree structure that grows upwards
  const createTreePaths = () => {
    console.log('leafCount', leafCount);

    const trunkHeight = 120;
    const trunkWidth = 8;
    const branchWidth = 6;
    const subBranchWidth = 4;

    // Main trunk (always present)
    const trunkPath = Skia.Path.Make();
    trunkPath.moveTo(width / 2, 350);
    trunkPath.lineTo(width / 2, 350 - trunkHeight);
    const trunk = { path: trunkPath, strokeWidth: trunkWidth, color: '#8B5E3C' };

    const branches: Array<{
      path: any;
      strokeWidth: number;
      color: string;
      endX: number;
      endY: number;
      isLeft: boolean;
    }> = [];
    const leaves: Array<{ path: any; color: string }> = [];

    if (leafCount === 0) {
      return { trunk, branches, leaves };
    }

    // Calculate how many side branches we can have
    const maxSideBranches = Math.floor((leafCount - 1) / 4) + 1; // Each side branch can have 3 sub-branches + 1 leaf
    const currentSideBranches = Math.min(maxSideBranches, 3); // Limit to 3 side branches for visual balance

    for (let sideBranchIndex = 0; sideBranchIndex < currentSideBranches; sideBranchIndex++) {
      // Calculate if this side branch should be created based on message count
      const messagesForThisBranch = Math.min(leafCount - sideBranchIndex * 4, 4);
      if (messagesForThisBranch <= 0) break;

      // Side branch position on main stem (alternating left/right)
      // Start from lower part of trunk and work upwards
      const isLeft = sideBranchIndex % 2 === 1; // Start with right (false), then alternate
      const sideBranchHeight = 350 - 30 - sideBranchIndex * 20; // Start from 30px from bottom, go up
      const sideBranchLength = 35;
      const sideBranchAngle = isLeft ? -70 : 70; // More pronounced angles for clear alternation

      console.log(
        `Side branch ${sideBranchIndex}: isLeft=${isLeft}, angle=${sideBranchAngle}, height=${sideBranchHeight}`
      );

      // Create side branch
      const sideBranchPath = Skia.Path.Make();
      sideBranchPath.moveTo(width / 2, sideBranchHeight);
      const sideBranchEndX =
        width / 2 + Math.cos((sideBranchAngle * Math.PI) / 180) * sideBranchLength;
      const sideBranchEndY =
        sideBranchHeight - Math.sin((Math.abs(sideBranchAngle) * Math.PI) / 180) * sideBranchLength;
      sideBranchPath.lineTo(sideBranchEndX, sideBranchEndY);

      branches.push({
        path: sideBranchPath,
        strokeWidth: branchWidth,
        color: '#8B5E3C',
        endX: sideBranchEndX,
        endY: sideBranchEndY,
        isLeft,
      });

      // Add leaf at the end of side branch
      if (messagesForThisBranch >= 1) {
        const leafSize = 10;
        const leaf = Skia.Path.MakeFromSVGString(
          `M${sideBranchEndX},${sideBranchEndY} q${leafSize},-${leafSize} ${leafSize * 2},0 q-${leafSize},${leafSize} -${leafSize * 2},0 z`
        );
        leaves.push({ path: leaf!, color: '#34D399' });
      }

      // Create sub-branches (up to 3 per side branch)
      const subBranchCount = Math.min(messagesForThisBranch - 1, 3);
      for (let subBranchIndex = 0; subBranchIndex < subBranchCount; subBranchIndex++) {
        const subBranchLength = 20;
        // Sub-branches also grow upward from the side branch
        const subBranchAngle = (45 + subBranchIndex * 15) * (isLeft ? -1 : 1);
        const subBranchStartX = sideBranchEndX;
        const subBranchStartY = sideBranchEndY;

        const subBranchPath = Skia.Path.Make();
        subBranchPath.moveTo(subBranchStartX, subBranchStartY);
        const subBranchEndX =
          subBranchStartX + Math.cos((subBranchAngle * Math.PI) / 180) * subBranchLength;
        const subBranchEndY =
          subBranchStartY - Math.sin((Math.abs(subBranchAngle) * Math.PI) / 180) * subBranchLength;
        subBranchPath.lineTo(subBranchEndX, subBranchEndY);

        branches.push({
          path: subBranchPath,
          strokeWidth: subBranchWidth,
          color: '#8B5E3C',
          endX: subBranchEndX,
          endY: subBranchEndY,
          isLeft,
        });

        // Add leaf at the end of sub-branch
        const leafSize = 8;
        const leaf = Skia.Path.MakeFromSVGString(
          `M${subBranchEndX},${subBranchEndY} q${leafSize},-${leafSize} ${leafSize * 2},0 q-${leafSize},${leafSize} -${leafSize * 2},0 z`
        );
        leaves.push({ path: leaf!, color: '#34D399' });
      }
    }

    return { trunk, branches, leaves };
  };

  const { trunk, branches, leaves } = React.useMemo(() => createTreePaths(), [leafCount]);

  function addElement() {
    const newMessageId = id();

    db.transact(
      db.tx.messages[newMessageId].update({
        content: message,
        sender: 'user',
        createdAt: Date.now(),
      })
    );

    setMessage('');
  }

  function deleteAllMessages() {
    const messageIds = messages.map((message) => message.id);

    messageIds.map((messageId) => {
      db.transact(db.tx.messages[messageId].delete());
    });
  }

  return (
    <Container>
      <Text className="font-fredoka-semibold text-2xl">Blessing Tree</Text>
      <TextInput placeholder="Message" onChangeText={(text) => setMessage(text)} />
      <Button title="Add Branch" onPress={addElement} />
      <Button title="Delete All Branches" onPress={deleteAllMessages} />
      <Animated.View style={[{ width, height: 400 }, animatedStyle]}>
        <Canvas style={{ flex: 1 }}>
          <Group>
            {/* Trunk */}
            <Path
              path={trunk.path}
              color={trunk.color}
              strokeWidth={trunk.strokeWidth}
              style="stroke"
            />

            {/* Branches */}
            {branches.map((branch, idx) => (
              <Path
                key={`branch-${idx}`}
                path={branch.path}
                color={branch.color}
                strokeWidth={branch.strokeWidth}
                style="stroke"
              />
            ))}

            {/* Leaves - positioned at branch ends */}
            {leaves.map((leaf, idx) => (
              <Path key={`leaf-${idx}`} path={leaf.path} color={leaf.color} style="fill" />
            ))}
          </Group>
        </Canvas>
      </Animated.View>
    </Container>
  );
};

export default TestScreen;

const styles = StyleSheet.create({});
