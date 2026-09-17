import { moneyBare } from '@/lib/domain/format';
import type { PublicMenuGroup } from '@/lib/content';

export function MenuGroups({
  groups,
  withAnchors = false,
}: {
  groups: PublicMenuGroup[];
  withAnchors?: boolean;
}) {
  if (groups.length === 0) {
    return (
      <p className="text-sm text-steel">
        The menu is being updated. Come past the trailer and ask what is on today.
      </p>
    );
  }

  return (
    <div className="space-y-12">
      {groups.map((group, index) => {
        const isFood = group.category.toLowerCase() === 'food';
        const firstDrinkIndex = groups.findIndex((row) => row.category.toLowerCase() !== 'food');
        const sectionId = withAnchors
          ? isFood
            ? 'food'
            : index === firstDrinkIndex
              ? 'coffee'
              : undefined
          : undefined;

        return (
          <section key={group.category} id={sectionId} className="scroll-mt-24">
          <h2 className="mb-5 flex items-center gap-3 text-[11px] font-semibold tracking-[0.16em] text-steel uppercase">
            {group.category}
            <span className="h-px flex-1 bg-line" />
          </h2>

          <ul className="space-y-6">
            {group.items.map((item) => (
              <li key={item.id} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                <div className="min-w-[14rem] flex-1">
                  <h3 className="text-lg font-semibold text-ink">{item.name}</h3>
                  {item.description && (
                    <p className="mt-0.5 max-w-prose text-sm text-steel">{item.description}</p>
                  )}
                </div>

                <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
                  {item.sizes.map((size) => (
                    <div key={size.id} className="text-right">
                      <p className="text-[10px] font-semibold tracking-[0.08em] text-steel-light uppercase">
                        {size.label}
                      </p>
                      <p className="tabular text-base font-semibold text-ink">
                        R {moneyBare(size.price, 0)}
                      </p>
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
          </section>
        );
      })}
    </div>
  );
}
