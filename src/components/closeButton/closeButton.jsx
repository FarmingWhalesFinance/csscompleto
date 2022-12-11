import React from 'react'
import classnames from 'classnames'

import closeButton from './closeButton.module.scss'
import styles from './closeButton.module.scss'

export function CloseButton({ className, ...props }) {
  const classNames = classnames(className, closeButton)

  return (
    <button className={styles.classNames} {...props}>
      <span></span>
      <span></span>
    </button>
  )
}
