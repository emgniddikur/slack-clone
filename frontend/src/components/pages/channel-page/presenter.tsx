import { Container } from "./styles";

import { ChannelList } from "@/components/channel-list";
import { ChatRoom, ChatRoomProps } from "@/components/chat-room";
import { Channel } from "@/graphql/generated";

export type ChannelPagePresenterProps = {
  channels: Pick<Channel, "id" | "name">[] | undefined;
  chatRoomProps: ChatRoomProps;
};

export const ChannelPagePresenter: React.FC<ChannelPagePresenterProps> = (
  props,
) => {
  return (
    <Container>
      {props.channels != null && <ChannelList channels={props.channels} />}
      <ChatRoom {...props.chatRoomProps} />
    </Container>
  );
};
