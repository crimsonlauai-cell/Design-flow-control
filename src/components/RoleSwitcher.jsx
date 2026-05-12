import { Listbox, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import clsx from 'clsx';

export default function RoleSwitcher() {
  const { currentRole, setCurrentRole, roles } = useAppContext();

  return (
    <div className="w-48">
      <Listbox value={currentRole} onChange={setCurrentRole}>
        <div className="relative mt-1">
          <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-brand sm:text-sm">
            <span className="block truncate font-medium text-slate-700">Role: {currentRole}</span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden="true" />
            </span>
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-50">
              {roles.map((role, roleIdx) => (
                <Listbox.Option
                  key={roleIdx}
                  className={({ active }) =>
                    clsx(
                      'relative cursor-pointer select-none py-2 pl-10 pr-4',
                      active ? 'bg-brand-light text-brand' : 'text-slate-900'
                    )
                  }
                  value={role}
                >
                  {({ selected }) => (
                    <>
                      <span className={clsx('block truncate', selected ? 'font-medium' : 'font-normal')}>
                        {role}
                      </span>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-brand">
                          <Check className="h-4 w-4" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
}
