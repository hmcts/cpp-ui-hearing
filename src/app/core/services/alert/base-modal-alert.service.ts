import { Injectable } from '@angular/core';
import { BsModalService } from 'ngx-bootstrap/modal';

export type ModalParams<T extends Object = Object, P extends keyof T = keyof T> = {
  [K in P]: T[K];
} & {
  onSubmit: () => void;
  onCancel?: () => void;
};
@Injectable()
export abstract class BaseModalAlertService {
  constructor(protected modalService: BsModalService) {}

  abstract showModal(params: ModalParams): void;
}
