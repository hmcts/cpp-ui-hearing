import { TestBed } from '@angular/core/testing';
import { UsersGroupsActions } from '@cpp/users-groups';
import { Store } from '@ngrx/store';

export const enableFeature = (key: string) => {
  TestBed.inject(Store).dispatch(
    UsersGroupsActions.setUserServices({
      userServices: [
        {
          name: '*',
          containsSearch: false,
          features: [
            {
              type: 'COMPONENT',
              key,
              title: '*'
            }
          ]
        }
      ]
    })
  );
};
