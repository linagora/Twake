import * as Text from "@atoms/text";

export const Section = (props: { suffix?: React.ReactNode; title: string }) => {
  return (
    <div className="flex items-center">
      <Text.Section className="grow text-lg leading-6">
        {props.title}
      </Text.Section>
      {!!props.suffix && (
        <div className="ml-4 flex-shrink-0 flex">{props.suffix}</div>
      )}
    </div>
  );
};
