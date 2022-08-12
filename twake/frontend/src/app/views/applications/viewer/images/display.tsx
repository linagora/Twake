import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

export default (props: { download: string }) => {
  return (
    <TransformWrapper>
      <TransformComponent>
        <img
          src={props.download}
          className="object-contain max-w-full max-h-full m-auto absolute left-0 top-0 bottom-0 right-0"
          onLoad={() => {
            console.log('loaded image');
          }}
        />
      </TransformComponent>
    </TransformWrapper>
  );
};
