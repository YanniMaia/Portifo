// Miolo comum do Button e do ButtonLink (DS-11): ícone à esquerda (20 px), texto e seta à direita
// (20 px). Os dois ícones são decorativos (`aria-hidden`); o nome acessível é o texto.
// `avisoOculto` (ex.: "(abre em nova aba)", §11) fica dentro do rótulo, visualmente oculto, depois
// de um espaço em nó de texto próprio: assim o nome acessível sai "GitHub (abre em nova aba)", e o
// espaço no fim da linha não aparece.
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { Icon } from '@/components/Icon';
import styles from './Button.module.css';

interface ConteudoDoBotaoProps {
  iconLeft?: LucideIcon;
  arrow?: boolean;
  avisoOculto?: string;
  children: ReactNode;
}

export function ConteudoDoBotao({
  iconLeft,
  arrow = false,
  avisoOculto,
  children,
}: ConteudoDoBotaoProps) {
  return (
    <>
      {iconLeft ? <Icon icon={iconLeft} size={20} className={styles.icon} /> : null}
      <span className={styles.label}>
        {children}
        {avisoOculto ? (
          <>
            {' '}
            <span className="visually-hidden">{avisoOculto}</span>
          </>
        ) : null}
      </span>
      {arrow ? <Icon icon={ArrowRight} size={20} className={styles.arrow} /> : null}
    </>
  );
}
