import { Button } from 'app/atoms/button/button';
import { ZoomOutIcon, ZoomInIcon, RotateCwIcon } from 'app/atoms/icons-agnostic';

export default () => {
  return (
    <>
      <Button
        iconSize="lg"
        className="ml-4 !rounded-full"
        theme="dark"
        size="lg"
        icon={ZoomOutIcon}
      />
      <Button
        iconSize="lg"
        className="ml-4 !rounded-full"
        theme="dark"
        size="lg"
        icon={ZoomInIcon}
      />
      <Button
        iconSize="lg"
        className="ml-4 !rounded-full"
        theme="dark"
        size="lg"
        icon={RotateCwIcon}
      />
    </>
  );
};
