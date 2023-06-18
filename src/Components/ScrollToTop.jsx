import { ActionIcon, Affix, Transition } from '@mantine/core';
import { useEffect, useState } from 'react';
import { IoArrowUp } from 'react-icons/io5';

export function ScrollToTop({ scroller, bottom = 10 }) {
  const [scrollY, setScrollY] = useState();

  const handleScroll = () => {
    setScrollY(scroller.scrollTop);
  };

  useEffect(() => {
    if (scroller !== undefined) {
      scroller.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        scroller.removeEventListener('scroll', handleScroll);
      };
    }
  }, [scroller]);

  return <Affix position={{ bottom, right: 20 }}>
    <Transition transition='slide-up' mounted={scrollY > 0}>
      {transitionStyles =>
        <div style={transitionStyles} >
          <ActionIcon size='lg' color='primary' variant='filled'
            onClick={() => scroller.scrollTo({ top: 0, behavior: 'smooth' })}>
            <IoArrowUp size={25} />
          </ActionIcon>
        </div>}
    </Transition>
  </Affix>;
}
