import { ComponentProps } from 'react';
import { Platform, Pressable } from 'react-native';

type ClickableProps = ComponentProps<typeof Pressable>;

const webPointerStyle = Platform.OS === 'web' ? { cursor: 'pointer' as const } : undefined;

export function Clickable({ style, ...props }: ClickableProps) {
  const combinedStyle: ClickableProps['style'] =
    typeof style === 'function'
      ? (state) => [webPointerStyle, style(state)]
      : [webPointerStyle, style];

  return <Pressable {...props} style={combinedStyle} />;
}
