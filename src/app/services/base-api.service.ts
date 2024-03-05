import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, first } from 'rxjs';
import { ACCESS_TOKEN_KEY } from '../models/constants/sessionStorage';
import { environment } from 'src/environments/environment';
import { Pagination } from '../models/api/pagination.model';
import { Router } from '@angular/router';
import { LoginErrorService } from './login-error.service';
import {SnackbarService} from "./snackbar.service";

@Injectable({
  providedIn: 'root'
})
export abstract class BaseApiService {
  constructor(
    private router: Router,
    private http: HttpClient,
    private snackBarService: SnackbarService,
    private loginErrorService: LoginErrorService
  ) {}

  async getForApi<T = null>(path: string, params: object | null = null): Promise<T> {
    return await this.handleResult(
      this.http.get<T>(this.getApiPath(path), {
        headers: this.getApiAuthenticationHeaders(),
        params: { ...params }
      })
    );
  }

  async getForApiWithPagination<T>(path: string, currentPage: number, parameters: object | null = null): Promise<Pagination<T>> {
    return await this.handleResultForPagination(
      this.http.get<Pagination<T>>(this.getApiPath(path), {
        headers: this.getApiAuthenticationHeaders(),
        observe: 'response',
        params: {
          ...parameters,
          page: currentPage,
          per_page: '10'
        }
      })
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async postForApi<T>(path: string, body: any): Promise<T> {
    return await this.handleResult(
      this.http.post<T>(this.getApiPath(path), body, {
        headers: this.getApiAuthenticationHeaders()
      })
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async patchForApi<T>(path: string, body: any): Promise<T> {
    return await this.handleResult(
      this.http.patch<T>(this.getApiPath(path), body, {
        headers: this.getApiAuthenticationHeaders()
      })
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async deleteForApi(path: string, params: object = {}): Promise<any> {
    return await this.handleResult(
      this.http.delete(this.getApiPath(path), {
        headers: this.getApiAuthenticationHeaders(),
        params: { ...params }
      })
    );
  }

  async getForAlgorithmApi<T = null>(algo_store_url: string, path: string, parameters: object | null = null): Promise<T> {
    if (algo_store_url.endsWith('/')) {
      algo_store_url = algo_store_url.slice(0, -1);
    }
    return await this.handleResult(
      this.http.get<T>(algo_store_url + path, {
        headers: { server_url: `${environment.server_url}${environment.api_path}`, ...this.getApiAuthenticationHeaders() },
        params: { ...parameters }
      })
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getApiAuthenticationHeaders(): any {
    const accessToken = sessionStorage.getItem(ACCESS_TOKEN_KEY);

    if (!accessToken) return {};

    return { Authorization: `Bearer ${accessToken}` };
  }

  private async handleResult<T = null>(request: Observable<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      request.pipe(first()).subscribe(
        (response) => {
          resolve(response as T);
        },
        (error) => {
          const errorMsg = this.getErrorMsg(error);
          // TODO it would be nicer to find another way to check if we are on the login page. Difficulty is to
          // prevent circular dependencies, that's why we can't import authService here
          if (this.router.url.startsWith('/auth')) {
            // when not logged in, use loginErrorService to show messages clearly on login page
            this.loginErrorService.setError(errorMsg);
          } else {
            // when logged in, show messages in snackbar
            this.snackBarService.showMessage(errorMsg);
          }
          reject(error);
        }
      );
    });
  }

  private async handleResultForPagination<T>(request: Observable<HttpResponse<Pagination<T>>>): Promise<Pagination<T>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new Promise<any>((resolve, reject) => {
      request.pipe(first()).subscribe(
        (response) => {
          const body = response.body as Pagination<T>;

          if (body.links) {
            body.links['total'] = Number.parseInt(response.headers.get('Total-Count') || '0');
          }
          resolve(body);
        },
        (error) => {
          if (error instanceof HttpErrorResponse) {
            this.snackBarService.showMessage(error.message || 'An error occurred');
          } else {
            const errorMsg = this.getErrorMsg(error);
            this.snackBarService.showMessage(errorMsg);
          }

          reject(error);
        }
      );
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getErrorMsg(error: any): string {
    let errorMsg = error.error?.msg ? error.error?.msg : 'An error occurred';
    // Vantage6 server does request validation - if there are errors, they are returned in the response.
    // Here we append these errors to the error message.
    if (error.error?.errors) {
      errorMsg +=
        ': ' +
        Object.keys(error.error?.errors)
          .map((key) => {
            return key + ': ' + error.error?.errors[key];
          })
          .join(', ');
    }
    return errorMsg;
  }

  protected abstract getApiPath(path: string): string
}
