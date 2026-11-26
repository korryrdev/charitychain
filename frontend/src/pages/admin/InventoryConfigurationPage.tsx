import { useState, type FormEvent } from 'react';
import { adminApi } from '../../features/administration/services/admin.api';
import { getErrorMessage } from '../../services/errorMapper';

interface CategoryFormState {
  code: string;
  name: string;
  description: string;
}

interface LocationFormState {
  code: string;
  name: string;
}

const emptyCategory: CategoryFormState = { code: '', name: '', description: '' };
const emptyLocation: LocationFormState = { code: '', name: '' };

export function InventoryConfigurationPage() {
  const [category, setCategory] = useState<CategoryFormState>(emptyCategory);
  const [location, setLocation] = useState<LocationFormState>(emptyLocation);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      await adminApi.createInventoryCategory({ ...category, code: category.code.toUpperCase() });
      setCategory(emptyCategory);
      setMessage('Goods category created. It is now available for controlled inventory intake.');
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, 'Failed to create goods category.'));
    }
  };

  const createLocation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      await adminApi.createInventoryLocation({ ...location, code: location.code.toUpperCase() });
      setLocation(emptyLocation);
      setMessage('Storage location created.');
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, 'Failed to create storage location.'));
    }
  };

  return (
    <main className="portal-page admin-page">
      <p className="section-kicker">Inventory configuration</p>
      <h1>Categories and storage locations.</h1>
      <p className="portal-page__lead">
        These controlled values govern physical-goods intake and storage. They do not receive
        donations, alter stock, or release collections.
      </p>
      {error && <p className="form-error">{error}</p>}
      {message && <p className="admin-feedback">{message}</p>}
      <div className="admin-two-column">
        <section className="portal-card">
          <h2>Add goods category</h2>
          <form onSubmit={createCategory}>
            <label>
              Code
              <input
                value={category.code}
                onChange={(event) => setCategory({ ...category, code: event.target.value })}
                placeholder="PERSONAL_CARE"
                required
              />
            </label>
            <label>
              Name
              <input
                value={category.name}
                onChange={(event) => setCategory({ ...category, name: event.target.value })}
                placeholder="Personal care"
                required
              />
            </label>
            <label>
              Description
              <textarea
                value={category.description}
                onChange={(event) => setCategory({ ...category, description: event.target.value })}
              />
            </label>
            <button className="primary-button">Create category</button>
          </form>
        </section>
        <section className="portal-card">
          <h2>Add storage location</h2>
          <form onSubmit={createLocation}>
            <label>
              Code
              <input
                value={location.code}
                onChange={(event) => setLocation({ ...location, code: event.target.value })}
                placeholder="MAIN_STORE"
                required
              />
            </label>
            <label>
              Name
              <input
                value={location.name}
                onChange={(event) => setLocation({ ...location, name: event.target.value })}
                placeholder="Main donation store"
                required
              />
            </label>
            <button className="primary-button">Create location</button>
          </form>
        </section>
      </div>
      <section className="portal-card">
        <h2>Stock safeguards</h2>
        <p>
          Only donor-confirmed and inspection-accepted goods reach available inventory. Every stock
          adjustment needs a reason and an immutable movement record.
        </p>
      </section>
    </main>
  );
}
