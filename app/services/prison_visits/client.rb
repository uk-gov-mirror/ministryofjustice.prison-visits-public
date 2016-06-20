require 'excon'

module PrisonVisits
  APIError = Class.new(StandardError)

  class Client
    TIMEOUT = 2 # seconds

    def initialize(host)
      @host = host
      @connection = Excon.new(
        host,
        persistent: true,
        connect_timeout: TIMEOUT,
        read_timeout: TIMEOUT,
        write_timeout: TIMEOUT,
        # This results in up to 3 requests for idempotent methods (default: 4)
        retry_limit: 3
      )
    end

    def get(route, params: {}, idempotent: true, allow_not_found: false)
      request(:get,
        route,
        params: params,
        idempotent: idempotent,
        allow_not_found: allow_not_found)
    end

    def post(route, params:, idempotent: false)
      request(:post,
        route,
        params: params,
        idempotent: idempotent,
        allow_not_found: false)
    end

    def delete(route, params: {}, idempotent: true)
      request(:delete,
        route,
        params: params,
        idempotent: idempotent,
        allow_not_found: false)
    end

    def healthcheck
      @connection.head(path: 'healthcheck')
    end

  private

    # rubocop:disable Metrics/MethodLength
    # rubocop:disable Metrics/AbcSize
    def request(method, route, params:, idempotent:, allow_not_found:)
      # For cleanliness, strip initial / if supplied
      route = route.sub(%r{^\/}, '')
      path = "/api/#{route}"
      api_method = "#{method.to_s.upcase} #{path}"

      options = {
        method: method,
        path: path,
        expects: expected_response_status(allow_not_found: allow_not_found),
        headers: {
          'Accept' => 'application/json',
          'Accept-Language' => I18n.locale,
          'X-Request-Id' => RequestStore.store[:request_id]
        },
        idempotent: idempotent
      }.deep_merge(params_options(method, params))

      message = "Calling PVB API: #{api_method}"
      response = Instrumentation.time_and_log(message, :api) {
        @connection.request(options)
      }

      JSON.parse(response.body)
    rescue Excon::Errors::HTTPStatusError => e
      body = e.response.body

      # API errors should be returned as JSON, but there are many scenarios
      # where this may not be the case.
      begin
        error = JSON.parse(body)
      rescue JSON::ParserError
        # Present non-JSON bodies truncated (e.g. this could be HTML)
        error = "(invalid-JSON) #{body[0, 80]}"
      end

      raise APIError,
        "Unexpected status #{e.response.status} calling #{api_method}: #{error}"
    rescue Excon::Errors::Error => e
      raise APIError, "Exception #{e.class} calling #{api_method}: #{e}"
    end
    # rubocop:enable Metrics/MethodLength
    # rubocop:enable Metrics/AbcSize

    def expected_response_status(allow_not_found:)
      if allow_not_found
        [200, 404]
      else
        [200]
      end
    end

    # Returns excon options which put params in either the query string or body.
    def params_options(method, params)
      return {} if params.empty?

      if method == :get || method == :delete
        { query: params }
      else
        {
          body: params.to_json,
          headers: { 'Content-Type' => 'application/json' }
        }
      end
    end
  end
end
