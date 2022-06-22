import { InputClearIcon } from 'app/atoms/icons-agnostic';
import Languages from 'app/features/global/services/languages-service';
import { SearchInputState } from 'app/features/search/state/search-input';
import InputIcon from 'components/inputs/input-icon.js';
import Search from 'features/global/services/search-service';
import { useEffect } from 'react';
import { useRecoilState } from 'recoil';

const SearchInput = () => {
  const [searchInput, setSearchInput] = useRecoilState(SearchInputState);

  useEffect(() => {
    Search.setValue(searchInput);
    if (searchInput) Search.search(true);
  }, [searchInput]);

  return (
    <div className="input-wrapper">
      <InputIcon
        autoFocus
        icon="search"
        className="full_width search-input"
        big
        placeholder={Languages.t(
          'scenes.app.mainview.quick_search_placeholder',
          [],
          'Recherche rapide',
        )}
        value={searchInput}
        onChange={(e: any) => setSearchInput(e.target.value)}
      />

      {searchInput && (
        <div className="input-clear-btn" onClick={() => setSearchInput('')}>
          <InputClearIcon className="fill-gray-500" />
        </div>
      )}
    </div>
  );
};

export default SearchInput;
