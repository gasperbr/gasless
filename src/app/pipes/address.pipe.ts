import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'address'
})
export class AddressPipe implements PipeTransform {

  transform(value: string, ...args: unknown[]): unknown {
    const len = value.length;
    return value.slice(0, 6) + '...' + value.slice(len - 5, len - 1);
  }

}
